from datetime import datetime, time, timedelta

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer

MAX_FOCUS_STARS = 3
SUGGESTION_LOOKBACK_DAYS = 14
MIN_REPEATS_FOR_SUGGESTION = 2
MAX_SUGGESTIONS = 5


def _reset_hour_for(user):
    profile = getattr(user, 'profile', None)
    return profile.reset_hour if profile else 0


def get_today_range(user):
    """The [start, end) datetime bounds of the user's "today", shifted by
    their custom reset hour (Profile.reset_hour) instead of always midnight.
    e.g. reset_hour=4 means the day runs 4am-to-4am, so 2am still counts as
    "yesterday" for daily-reset purposes.
    """
    reset_hour = _reset_hour_for(user)
    now = timezone.localtime(timezone.now())
    boundary_date = (now - timedelta(hours=reset_hour)).date()
    start = timezone.make_aware(datetime.combine(boundary_date, time(hour=reset_hour)))
    return start, start + timedelta(days=1)


def get_previous_day_range(user):
    """The [start, end) bounds of the day immediately before "today" —
    what recap/carry-forward look back at."""
    start, _end = get_today_range(user)
    return start - timedelta(days=1), start


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD for tasks, scoped to the authenticated user + "today" (the
    daily-reset requirement), plus a few small actions for the opt-in
    focus/carry-forward/recap/chip features layered on top.

    Scoping the queryset itself (rather than just the list action) means
    tasks from previous days — or another user's tasks — are invisible to
    the whole API, not just hidden from the list view.
    """

    serializer_class = TaskSerializer

    def get_queryset(self):
        start, end = get_today_range(self.request.user)
        return Task.objects.filter(user=self.request.user, created_at__gte=start, created_at__lt=end)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        wants_star = serializer.validated_data.get('starred')
        if wants_star and not serializer.instance.starred:
            start, end = get_today_range(self.request.user)
            starred_count = Task.objects.filter(
                user=self.request.user, created_at__gte=start, created_at__lt=end, starred=True
            ).count()
            if starred_count >= MAX_FOCUS_STARS:
                raise ValidationError(
                    f"You can only focus on up to {MAX_FOCUS_STARS} tasks at a time — "
                    "unstar one first."
                )
        serializer.save()

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Persist a new drag-and-drop priority order for today's tasks —
        the full ordered list of ids is sent each time and reassigned
        sequential order values, so a partial/stale list can't corrupt order."""
        ids = request.data.get('task_ids', [])
        valid_ids = set(self.get_queryset().values_list('id', flat=True))
        for index, task_id in enumerate(ids):
            task_id = int(task_id)
            if task_id in valid_ids:
                Task.objects.filter(id=task_id, user=request.user).update(order=index)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def recap(self, request):
        """Stats for the most recent past day that had tasks, for the
        once-per-day end-of-day summary. The main queryset only ever shows
        "today", so once the date rolls over, yesterday's counts have to be
        read through this dedicated action instead.
        """
        start, end = get_previous_day_range(request.user)
        day_tasks = Task.objects.filter(user=request.user, created_at__gte=start, created_at__lt=end)
        total = day_tasks.count()
        if total == 0:
            return Response(status=status.HTTP_204_NO_CONTENT)
        completed = day_tasks.filter(completed=True).count()
        return Response({'date': start.date().isoformat(), 'total': total, 'completed': completed})

    @action(detail=False, methods=['get'], url_path='carry-forward-candidates')
    def carry_forward_candidates(self, request):
        """Yesterday's unfinished tasks that haven't been resolved (carried
        or skipped) by the prompt yet."""
        start, end = get_previous_day_range(request.user)
        candidates = Task.objects.filter(
            user=request.user,
            created_at__gte=start,
            created_at__lt=end,
            completed=False,
            carry_resolved=False,
        )
        return Response(TaskSerializer(candidates, many=True).data)

    @action(detail=False, methods=['post'], url_path='carry-forward')
    def carry_forward(self, request):
        """Resolve the carry-forward prompt: mark every offered candidate as
        resolved (so it's never asked about again), and create fresh
        today-tasks for whichever ids the user opted to bring forward.
        Never automatic — this only runs when the user submits a choice.
        """
        start, end = get_previous_day_range(request.user)
        candidates = Task.objects.filter(
            user=request.user,
            created_at__gte=start,
            created_at__lt=end,
            completed=False,
            carry_resolved=False,
        )
        selected_ids = {int(i) for i in request.data.get('task_ids', [])}
        selected = [t for t in candidates if t.id in selected_ids]

        created = [
            Task.objects.create(user=request.user, text=task.text) for task in selected
        ]
        candidates.update(carry_resolved=True)

        return Response(TaskSerializer(created, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Auto-detected quick-add chips: the user's most repeated task texts
        over the last two weeks, so retyping "gym" or "call mom" for the
        fifth time becomes a single tap instead.
        """
        today_start, _end = get_today_range(request.user)
        since = today_start - timedelta(days=SUGGESTION_LOOKBACK_DAYS)
        texts = (
            Task.objects.filter(user=request.user, created_at__gte=since)
            .order_by('-created_at')
            .values_list('text', flat=True)
        )

        # Group by normalized text, keeping each group's most recent casing
        # and counting occurrences, without relying on DB-specific DISTINCT.
        groups = {}
        for text in texts:
            key = text.strip().lower()
            if key not in groups:
                groups[key] = {'text': text.strip(), 'count': 0}
            groups[key]['count'] += 1

        ranked = sorted(
            (g for g in groups.values() if g['count'] >= MIN_REPEATS_FOR_SUGGESTION),
            key=lambda g: -g['count'],
        )
        return Response([g['text'] for g in ranked[:MAX_SUGGESTIONS]])

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """All-time profile stats. Tasks from past days are never deleted —
        the daily reset is just a query filter (see get_queryset) — so this
        reads real history, not a separately-tracked counter.

        Day grouping is done in Python (not a DB date truncation) because it
        has to respect the user's custom reset hour, not calendar midnight.
        """
        user = request.user
        reset_hour = _reset_hour_for(user)
        rows = Task.objects.filter(user=user).values_list('created_at', 'completed')

        total_created = 0
        total_completed = 0
        active_dates = set()
        completed_dates = set()
        day_completed_counts = {}

        for created_at, completed in rows:
            total_created += 1
            logical_date = timezone.localtime(created_at - timedelta(hours=reset_hour)).date()
            active_dates.add(logical_date)
            if completed:
                total_completed += 1
                completed_dates.add(logical_date)
                day_completed_counts[logical_date] = day_completed_counts.get(logical_date, 0) + 1

        today_start, _end = get_today_range(user)
        today_logical = today_start.date()

        current_streak = 0
        cursor = today_logical if today_logical in completed_dates else today_logical - timedelta(days=1)
        while cursor in completed_dates:
            current_streak += 1
            cursor -= timedelta(days=1)

        longest_streak = 0
        run = 0
        previous_date = None
        for d in sorted(completed_dates):
            run = run + 1 if previous_date and (d - previous_date).days == 1 else 1
            longest_streak = max(longest_streak, run)
            previous_date = d

        best_day = None
        if day_completed_counts:
            best_date, best_count = max(
                day_completed_counts.items(), key=lambda kv: (kv[1], kv[0])
            )
            best_day = {'date': best_date.isoformat(), 'completed': best_count}

        return Response({
            'total_created': total_created,
            'total_completed': total_completed,
            'days_active': len(active_dates),
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'best_day': best_day,
            'member_since': user.date_joined.date().isoformat(),
        })
