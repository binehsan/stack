from django.utils import timezone

from .models import Profile

# How stale last_active_at has to be before it's worth a write — without
# this, an active user hammering the API would trigger an UPDATE on nearly
# every request. Five minutes' resolution is plenty for a DAU/WAU count.
_STALE_AFTER = timezone.timedelta(minutes=5)


class TrackLastActiveMiddleware:
    """Updates Profile.last_active_at for whoever the request turns out to
    be authenticated as — backs the admin stats page's DAU/WAU numbers.

    Runs its check *after* get_response(), not before: this app's API auth
    is JWT (rest_framework_simplejwt), resolved inside DRF's APIView.dispatch
    — not Django's own session-based AuthenticationMiddleware — so
    request.user isn't populated yet by the time a pre-view middleware would
    normally run. DRF's Request.user property, once accessed inside the
    view, writes the resolved user back onto the underlying raw
    HttpRequest specifically so things like this can still see it
    afterward; checking post-response is what makes that work.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        user = getattr(request, 'user', None)
        # `user.pk` guards against DeleteAccountView: it deletes the caller
        # mid-request, which clears the in-memory instance's pk — querying
        # with that unsaved instance afterward raises, not just a no-op.
        if user is not None and user.is_authenticated and user.pk is not None:
            threshold = timezone.now() - _STALE_AFTER
            # Single UPDATE ... WHERE, not a fetch-then-save — the common
            # case (already recently active) costs one cheap conditional
            # write that matches zero rows, not a full row fetch every time.
            Profile.objects.filter(user=user).exclude(last_active_at__gte=threshold).update(
                last_active_at=timezone.now()
            )

        return response
