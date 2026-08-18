from django.contrib import admin
from django.contrib.auth.models import User
from django.shortcuts import render
from django.urls import path
from django.utils import timezone

from family.models import GroupStack
from tasks.models import Task

from .models import Profile, PushToken, WebPushSubscription

admin.site.register(Profile)
admin.site.register(PushToken)
admin.site.register(WebPushSubscription)


def stats_view(request):
    """A lightweight, self-hosted usage dashboard at /admin/stats/ — no
    third-party analytics account needed. Backed by Profile.last_active_at
    (see accounts/middleware.py's TrackLastActiveMiddleware) for the
    DAU/WAU/MAU numbers; everything else is a plain count against models
    that already exist. `admin.site.admin_view` (see get_urls below) is
    what makes this require staff login, same as every other admin page."""
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timezone.timedelta(days=7)
    month_start = now - timezone.timedelta(days=30)

    context = {
        **admin.site.each_context(request),
        'title': 'Stack usage stats',
        'total_users': User.objects.count(),
        'signups_today': User.objects.filter(date_joined__gte=today_start).count(),
        'signups_this_week': User.objects.filter(date_joined__gte=week_start).count(),
        'active_today': Profile.objects.filter(last_active_at__gte=today_start).count(),
        'active_this_week': Profile.objects.filter(last_active_at__gte=week_start).count(),
        'active_this_month': Profile.objects.filter(last_active_at__gte=month_start).count(),
        'total_tasks': Task.objects.count(),
        'total_group_stacks': GroupStack.objects.count(),
        'total_push_subscriptions': PushToken.objects.count() + WebPushSubscription.objects.count(),
    }
    return render(request, 'admin/stats.html', context)


_default_get_urls = admin.site.get_urls


def _get_urls():
    # Prepended, not appended — admin's own urls end with a catch-all
    # pattern for app/model pages that would otherwise shadow this.
    return [path('stats/', admin.site.admin_view(stats_view), name='stack-stats')] + _default_get_urls()


admin.site.get_urls = _get_urls
