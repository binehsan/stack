from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Profile

from .models import Task
from .views import MAX_FOCUS_STARS, get_previous_day_range, get_today_range


def make_user(email, password='testpass123', reset_hour=0):
    user = User.objects.create_user(username=email, email=email, password=password)
    Profile.objects.create(user=user, username=email.split('@')[0], reset_hour=reset_hour)
    return user


class GetTodayRangeTests(TestCase):
    """Direct tests of the day-boundary math itself — mocking `now` so the
    reset_hour behavior is deterministic regardless of when the test suite
    actually runs, rather than relying on real wall-clock offsets."""

    @patch('django.utils.timezone.now')
    def test_midnight_reset_hour_boundary_is_calendar_midnight(self, mock_now):
        # 2026-06-15 10:00 local, reset_hour=0 -> today starts at 2026-06-15 00:00.
        mock_now.return_value = timezone.make_aware(timezone.datetime(2026, 6, 15, 10, 0))
        user = make_user('midnight@example.com', reset_hour=0)
        start, end = get_today_range(user)
        self.assertEqual(start, timezone.make_aware(timezone.datetime(2026, 6, 15, 0, 0)))
        self.assertEqual(end, timezone.make_aware(timezone.datetime(2026, 6, 16, 0, 0)))

    @patch('django.utils.timezone.now')
    def test_custom_reset_hour_before_boundary_counts_as_previous_day(self, mock_now):
        # 2026-06-15 02:00 local, reset_hour=4 -> still "yesterday's" day
        # (which runs 06-14 04:00 through 06-15 04:00).
        mock_now.return_value = timezone.make_aware(timezone.datetime(2026, 6, 15, 2, 0))
        user = make_user('early@example.com', reset_hour=4)
        start, end = get_today_range(user)
        self.assertEqual(start, timezone.make_aware(timezone.datetime(2026, 6, 14, 4, 0)))
        self.assertEqual(end, timezone.make_aware(timezone.datetime(2026, 6, 15, 4, 0)))

    @patch('django.utils.timezone.now')
    def test_custom_reset_hour_after_boundary_counts_as_current_day(self, mock_now):
        # 2026-06-15 05:00 local, reset_hour=4 -> today's day has already
        # rolled over (06-15 04:00 through 06-16 04:00).
        mock_now.return_value = timezone.make_aware(timezone.datetime(2026, 6, 15, 5, 0))
        user = make_user('late@example.com', reset_hour=4)
        start, end = get_today_range(user)
        self.assertEqual(start, timezone.make_aware(timezone.datetime(2026, 6, 15, 4, 0)))
        self.assertEqual(end, timezone.make_aware(timezone.datetime(2026, 6, 16, 4, 0)))

    @patch('django.utils.timezone.now')
    def test_previous_day_range_is_one_day_before_today_range(self, mock_now):
        mock_now.return_value = timezone.make_aware(timezone.datetime(2026, 6, 15, 10, 0))
        user = make_user('prevday@example.com', reset_hour=0)
        today_start, today_end = get_today_range(user)
        prev_start, prev_end = get_previous_day_range(user)
        self.assertEqual(prev_end, today_start)
        self.assertEqual(prev_start, today_start - timedelta(days=1))
        self.assertEqual(today_end - today_start, prev_end - prev_start)


class TaskCrudTests(APITestCase):
    def test_create_and_list_task(self):
        user = make_user('crud@example.com')
        self.client.force_authenticate(user=user)
        create = self.client.post('/api/tasks/', {'text': 'Buy milk'})
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)

        listing = self.client.get('/api/tasks/')
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listing.data), 1)
        self.assertEqual(listing.data[0]['text'], 'Buy milk')

    def test_tasks_are_scoped_to_the_authenticated_user(self):
        owner = make_user('owner@example.com')
        other = make_user('other@example.com')
        self.client.force_authenticate(user=owner)
        self.client.post('/api/tasks/', {'text': 'Owner task'})

        self.client.force_authenticate(user=other)
        listing = self.client.get('/api/tasks/')
        self.assertEqual(listing.data, [])

    def test_tasks_outside_todays_window_are_not_listed(self):
        user = make_user('yesterday@example.com')
        self.client.force_authenticate(user=user)
        task = Task.objects.create(user=user, text='Old task')
        today_start, _end = get_today_range(user)
        Task.objects.filter(pk=task.pk).update(created_at=today_start - timedelta(hours=1))

        listing = self.client.get('/api/tasks/')
        self.assertEqual(listing.data, [])

    def test_patch_completed_and_delete(self):
        user = make_user('patchdelete@example.com')
        self.client.force_authenticate(user=user)
        created = self.client.post('/api/tasks/', {'text': 'Finish this'})
        task_id = created.data['id']

        patched = self.client.patch(f'/api/tasks/{task_id}/', {'completed': True}, format='json')
        self.assertEqual(patched.status_code, status.HTTP_200_OK)
        self.assertTrue(patched.data['completed'])

        deleted = self.client.delete(f'/api/tasks/{task_id}/')
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(pk=task_id).exists())

    def test_cannot_patch_another_users_task(self):
        owner = make_user('taskowner@example.com')
        intruder = make_user('intruder@example.com')
        self.client.force_authenticate(user=owner)
        created = self.client.post('/api/tasks/', {'text': 'Private'})
        task_id = created.data['id']

        self.client.force_authenticate(user=intruder)
        response = self.client.patch(f'/api/tasks/{task_id}/', {'completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FocusStarCapTests(APITestCase):
    def test_can_star_up_to_max_focus_stars(self):
        user = make_user('starrer@example.com')
        self.client.force_authenticate(user=user)
        ids = [self.client.post('/api/tasks/', {'text': f'Task {i}'}).data['id'] for i in range(MAX_FOCUS_STARS)]

        for task_id in ids:
            response = self.client.patch(f'/api/tasks/{task_id}/', {'starred': True}, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_starring_beyond_max_is_rejected(self):
        user = make_user('overstarrer@example.com')
        self.client.force_authenticate(user=user)
        ids = [
            self.client.post('/api/tasks/', {'text': f'Task {i}'}).data['id']
            for i in range(MAX_FOCUS_STARS + 1)
        ]
        for task_id in ids[:MAX_FOCUS_STARS]:
            self.client.patch(f'/api/tasks/{task_id}/', {'starred': True}, format='json')

        response = self.client.patch(f'/api/tasks/{ids[-1]}/', {'starred': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unstarring_frees_a_slot(self):
        user = make_user('unstarrer@example.com')
        self.client.force_authenticate(user=user)
        ids = [
            self.client.post('/api/tasks/', {'text': f'Task {i}'}).data['id']
            for i in range(MAX_FOCUS_STARS + 1)
        ]
        for task_id in ids[:MAX_FOCUS_STARS]:
            self.client.patch(f'/api/tasks/{task_id}/', {'starred': True}, format='json')

        self.client.patch(f'/api/tasks/{ids[0]}/', {'starred': False}, format='json')
        response = self.client.patch(f'/api/tasks/{ids[-1]}/', {'starred': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ReorderTests(APITestCase):
    def test_reorder_persists_given_sequence(self):
        user = make_user('reorderer@example.com')
        self.client.force_authenticate(user=user)
        ids = [self.client.post('/api/tasks/', {'text': f'Task {i}'}).data['id'] for i in range(3)]
        reversed_ids = list(reversed(ids))

        response = self.client.post('/api/tasks/reorder/', {'task_ids': reversed_ids}, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        listing = self.client.get('/api/tasks/')
        self.assertEqual([t['id'] for t in listing.data], reversed_ids)

    def test_reorder_ignores_ids_not_owned_by_caller(self):
        owner = make_user('reorderowner@example.com')
        intruder = make_user('reorderintruder@example.com')
        self.client.force_authenticate(user=owner)
        owned_id = self.client.post('/api/tasks/', {'text': 'Mine'}).data['id']

        self.client.force_authenticate(user=intruder)
        foreign_task_id = Task.objects.get(pk=owned_id)

        response = self.client.post(
            '/api/tasks/reorder/', {'task_ids': [foreign_task_id.pk]}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        foreign_task_id.refresh_from_db()
        self.assertEqual(foreign_task_id.order, 0)  # untouched


class RecapTests(APITestCase):
    def test_no_content_when_nothing_from_yesterday(self):
        user = make_user('norecap@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/tasks/recap/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_recap_reports_yesterdays_totals(self):
        user = make_user('recapuser@example.com')
        self.client.force_authenticate(user=user)
        prev_start, prev_end = get_previous_day_range(user)
        mid_yesterday = prev_start + (prev_end - prev_start) / 2

        done = Task.objects.create(user=user, text='Done yesterday', completed=True)
        Task.objects.filter(pk=done.pk).update(created_at=mid_yesterday)
        undone = Task.objects.create(user=user, text='Not done yesterday')
        Task.objects.filter(pk=undone.pk).update(created_at=mid_yesterday)

        response = self.client.get('/api/tasks/recap/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['completed'], 1)


class CarryForwardTests(APITestCase):
    def _make_yesterday_task(self, user, text, completed=False):
        prev_start, prev_end = get_previous_day_range(user)
        mid_yesterday = prev_start + (prev_end - prev_start) / 2
        task = Task.objects.create(user=user, text=text, completed=completed)
        Task.objects.filter(pk=task.pk).update(created_at=mid_yesterday)
        return Task.objects.get(pk=task.pk)

    def test_candidates_exclude_completed_and_already_resolved(self):
        user = make_user('candidates@example.com')
        self.client.force_authenticate(user=user)
        unfinished = self._make_yesterday_task(user, 'Unfinished')
        self._make_yesterday_task(user, 'Finished', completed=True)
        resolved = self._make_yesterday_task(user, 'Already resolved')
        resolved.carry_resolved = True
        resolved.save(update_fields=['carry_resolved'])

        response = self.client.get('/api/tasks/carry-forward-candidates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        texts = [t['text'] for t in response.data]
        self.assertEqual(texts, ['Unfinished'])

    def test_carry_forward_creates_selected_and_resolves_all_candidates(self):
        user = make_user('carryforward@example.com')
        self.client.force_authenticate(user=user)
        keep = self._make_yesterday_task(user, 'Keep me')
        skip = self._make_yesterday_task(user, 'Skip me')

        response = self.client.post(
            '/api/tasks/carry-forward/', {'task_ids': [keep.id]}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['text'], 'Keep me')

        # A fresh today-task was created for the selected one...
        self.assertTrue(Task.objects.filter(user=user, text='Keep me', carry_resolved=False).exists())
        # ...and BOTH yesterday's candidates are marked resolved, selected or not.
        keep.refresh_from_db()
        skip.refresh_from_db()
        self.assertTrue(keep.carry_resolved)
        self.assertTrue(skip.carry_resolved)
        # Skip was never re-created as a new task.
        self.assertFalse(Task.objects.filter(user=user, text='Skip me', carry_resolved=False).exists())


class SuggestionsTests(APITestCase):
    def test_suggests_texts_repeated_at_least_twice(self):
        user = make_user('suggestor@example.com')
        self.client.force_authenticate(user=user)
        for _ in range(3):
            self.client.post('/api/tasks/', {'text': 'gym'})
        self.client.post('/api/tasks/', {'text': 'one-off'})

        response = self.client.get('/api/tasks/suggestions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('gym', response.data)
        self.assertNotIn('one-off', response.data)

    def test_suggestions_are_case_and_whitespace_normalized(self):
        user = make_user('normalizer@example.com')
        self.client.force_authenticate(user=user)
        self.client.post('/api/tasks/', {'text': 'Call Mom'})
        self.client.post('/api/tasks/', {'text': ' call mom '})

        response = self.client.get('/api/tasks/suggestions/')
        matches = [t for t in response.data if t.strip().lower() == 'call mom']
        self.assertEqual(len(matches), 1)

    def test_suggestions_exclude_tasks_older_than_lookback_window(self):
        user = make_user('oldsuggestor@example.com')
        self.client.force_authenticate(user=user)
        for _ in range(2):
            task = Task.objects.create(user=user, text='ancient')
            Task.objects.filter(pk=task.pk).update(created_at=timezone.now() - timedelta(days=30))

        response = self.client.get('/api/tasks/suggestions/')
        self.assertNotIn('ancient', response.data)

    def test_suggestions_capped_at_five(self):
        user = make_user('capsuggestor@example.com')
        self.client.force_authenticate(user=user)
        for word in ['a', 'b', 'c', 'd', 'e', 'f']:
            for _ in range(2):
                self.client.post('/api/tasks/', {'text': word})

        response = self.client.get('/api/tasks/suggestions/')
        self.assertLessEqual(len(response.data), 5)


class StatsTests(APITestCase):
    def _make_task_on_day(self, user, days_ago, completed=True):
        today_start, _end = get_today_range(user)
        day_start = today_start - timedelta(days=days_ago)
        task = Task.objects.create(user=user, text=f'Day {days_ago}', completed=completed)
        Task.objects.filter(pk=task.pk).update(created_at=day_start + timedelta(hours=1))
        return task

    def test_empty_stats(self):
        user = make_user('emptystats@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/tasks/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_created'], 0)
        self.assertEqual(response.data['current_streak'], 0)
        self.assertEqual(response.data['longest_streak'], 0)
        self.assertIsNone(response.data['best_day'])

    def test_current_streak_counts_consecutive_completed_days_ending_today(self):
        user = make_user('streaker@example.com')
        self.client.force_authenticate(user=user)
        self._make_task_on_day(user, 0)
        self._make_task_on_day(user, 1)
        self._make_task_on_day(user, 2)
        # A gap at day 4 shouldn't be counted, only the run through today.
        self._make_task_on_day(user, 4)

        response = self.client.get('/api/tasks/stats/')
        self.assertEqual(response.data['current_streak'], 3)
        self.assertEqual(response.data['longest_streak'], 3)

    def test_streak_ending_yesterday_still_counts_as_current(self):
        # Not having completed anything YET today shouldn't zero out an
        # active streak — only a full missed day should.
        user = make_user('yesterdaystreak@example.com')
        self.client.force_authenticate(user=user)
        self._make_task_on_day(user, 1)
        self._make_task_on_day(user, 2)

        response = self.client.get('/api/tasks/stats/')
        self.assertEqual(response.data['current_streak'], 2)

    def test_longest_streak_can_exceed_current_streak(self):
        user = make_user('longeststreak@example.com')
        self.client.force_authenticate(user=user)
        # A 3-day streak in the past...
        self._make_task_on_day(user, 10)
        self._make_task_on_day(user, 11)
        self._make_task_on_day(user, 12)
        # ...then a gap, then a 1-day streak including today.
        self._make_task_on_day(user, 0)

        response = self.client.get('/api/tasks/stats/')
        self.assertEqual(response.data['current_streak'], 1)
        self.assertEqual(response.data['longest_streak'], 3)

    def test_best_day_picks_highest_completed_count(self):
        user = make_user('bestday@example.com')
        self.client.force_authenticate(user=user)
        self._make_task_on_day(user, 5)
        self._make_task_on_day(user, 5)
        self._make_task_on_day(user, 5)
        self._make_task_on_day(user, 6)

        response = self.client.get('/api/tasks/stats/')
        self.assertEqual(response.data['best_day']['completed'], 3)

    def test_totals_count_completed_and_incomplete_separately(self):
        user = make_user('totals@example.com')
        self.client.force_authenticate(user=user)
        self._make_task_on_day(user, 0, completed=True)
        self._make_task_on_day(user, 0, completed=False)

        response = self.client.get('/api/tasks/stats/')
        self.assertEqual(response.data['total_created'], 2)
        self.assertEqual(response.data['total_completed'], 1)
        self.assertEqual(response.data['days_active'], 1)


class StatsWithCustomResetHourTests(APITestCase):
    """Regression coverage for stats() with a non-zero reset_hour, driven
    through the real create/complete endpoints (not backdated rows) with a
    mocked clock — the closest thing to how a user with a custom reset hour
    would actually generate this data day over day. Guards against the
    day-boundary math in stats() (which re-derives each row's logical day
    from created_at) ever drifting out of sync with get_today_range()'s
    boundary (which the daily-reset queryset uses)."""

    @patch('django.utils.timezone.now')
    def test_streak_and_days_active_stay_correct_across_real_days(self, mock_now):
        user = make_user('customreset@example.com', reset_hour=4)
        self.client.force_authenticate(user=user)

        def complete_task_at(dt, text):
            mock_now.return_value = timezone.make_aware(dt)
            task_id = self.client.post('/api/tasks/', {'text': text}).data['id']
            self.client.patch(f'/api/tasks/{task_id}/', {'completed': True}, format='json')

        # Three consecutive logical days (reset_hour=4), each task added well
        # after that day's 4am rollover.
        complete_task_at(timezone.datetime(2026, 6, 10, 9, 0), 'Day1')
        # 2026-06-11 02:00 is BEFORE the 4am boundary, so it's still the same
        # logical day as the task above (06-10) — not a second day.
        mock_now.return_value = timezone.make_aware(timezone.datetime(2026, 6, 11, 2, 0))
        same_day_listing = self.client.get('/api/tasks/')
        self.assertEqual(len(same_day_listing.data), 1)

        complete_task_at(timezone.datetime(2026, 6, 11, 9, 0), 'Day2')
        complete_task_at(timezone.datetime(2026, 6, 12, 9, 0), 'Day3')

        mock_now.return_value = timezone.make_aware(timezone.datetime(2026, 6, 12, 9, 30))
        response = self.client.get('/api/tasks/stats/')
        self.assertEqual(response.data['current_streak'], 3)
        self.assertEqual(response.data['longest_streak'], 3)
        self.assertEqual(response.data['days_active'], 3)

        # A day is skipped entirely, then a task lands on a later day — the
        # streak should restart at 1 without disturbing the longest_streak.
        complete_task_at(timezone.datetime(2026, 6, 14, 9, 0), 'Day5')
        mock_now.return_value = timezone.make_aware(timezone.datetime(2026, 6, 14, 9, 30))
        response = self.client.get('/api/tasks/stats/')
        self.assertEqual(response.data['current_streak'], 1)
        self.assertEqual(response.data['longest_streak'], 3)
        self.assertEqual(response.data['days_active'], 4)
