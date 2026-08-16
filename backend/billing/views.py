import logging
from datetime import datetime, timezone as dt_timezone

from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from family.models import GroupStack

from .models import (
    FREE_DEVICE_LIMIT,
    FREE_GROUP_FOUND_LIMIT,
    PRO_VOICE_MONTHLY_LIMIT,
    Device,
    Entitlement,
    VoiceCapture,
    get_or_create_entitlement,
)
from .serializers import EntitlementSerializer

logger = logging.getLogger(__name__)


def _current_month_start():
    """Start of the current calendar month, in settings.TIME_ZONE, as an
    aware datetime — the boundary voice-capture quota resets on."""
    now_local = timezone.localtime(timezone.now())
    return now_local.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _next_month_start():
    """First of next month, in settings.TIME_ZONE — what the frontend shows
    as "resets on {date}", and the reported `voice_reset_at`."""
    this_month = _current_month_start()
    if this_month.month == 12:
        return this_month.replace(year=this_month.year + 1, month=1)
    return this_month.replace(month=this_month.month + 1)


def _voice_captures_this_month(user):
    return VoiceCapture.objects.filter(user=user, created_at__gte=_current_month_start()).count()


class EntitlementView(APIView):
    """GET /api/billing/entitlement/ — the single source of truth the
    frontend polls/refreshes for the caller's Pro status and usage
    counters. Auth required (global default IsAuthenticated)."""

    def get(self, request):
        entitlement = get_or_create_entitlement(request.user)
        is_pro = entitlement.is_pro
        reset_at = _next_month_start()

        data = {
            'is_pro': is_pro,
            'status': entitlement.status,
            'expires_at': entitlement.expires_at,
            'is_lifetime': entitlement.is_lifetime,
            'groups_founded': GroupStack.objects.filter(created_by=request.user).count(),
            'groups_founded_limit': None if is_pro else FREE_GROUP_FOUND_LIMIT,
            'devices': Device.objects.filter(user=request.user).count(),
            'devices_limit': None if is_pro else FREE_DEVICE_LIMIT,
            'voice_captures_used': _voice_captures_this_month(request.user),
            'voice_captures_limit': None if is_pro else PRO_VOICE_MONTHLY_LIMIT,
            'voice_reset_at': reset_at,
        }
        return Response(EntitlementSerializer(data).data)


class VoiceCaptureView(APIView):
    """POST /api/billing/voice-capture/ — gating + quota stub for a voice
    input feature that doesn't exist yet elsewhere in this codebase (no
    speech-to-text integration exists). This endpoint only reserves/tracks
    quota so the frontend can wire a real mic feature to it later; it never
    performs any transcription itself."""

    def post(self, request):
        entitlement = get_or_create_entitlement(request.user)
        if not entitlement.is_pro:
            return Response(
                {'detail': 'Voice input is a Stack Pro feature.', 'code': 'PAYWALL_VOICE'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        if _voice_captures_this_month(request.user) >= PRO_VOICE_MONTHLY_LIMIT:
            reset_at = _next_month_start()
            reset_label = f'{reset_at.strftime("%B")} {reset_at.day}'
            return Response(
                {
                    'detail': f"You've used your voice captures for this month, resets on {reset_label}.",
                    'code': 'VOICE_QUOTA_EXCEEDED',
                    'reset_at': reset_at,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        VoiceCapture.objects.create(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# RevenueCat event types that grant/renew active Pro access.
_ACTIVE_EVENT_TYPES = {'INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'}


class RevenueCatWebhookView(APIView):
    """POST /api/billing/revenuecat-webhook/ — receives RevenueCat's
    subscription lifecycle events and updates the matching user's
    Entitlement. This is the only path (besides is_lifetime set manually in
    admin) that ever writes Entitlement.status/expires_at — the backend
    never trusts a client-reported Pro flag.

    Auth: not JWT (RevenueCat isn't one of our users) — a shared secret in
    the Authorization header instead, checked by hand. Authentication is
    explicitly disabled for this view so the global JWTAuthentication class
    doesn't try (and fail) to parse the secret as a JWT before we get a
    chance to check it ourselves.
    """

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        expected_secret = settings.REVENUECAT_WEBHOOK_SECRET
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        provided_secret = auth_header[7:] if auth_header.startswith('Bearer ') else None

        # Reject-closed: an unset secret means webhooks are not configured,
        # not "accept anything" — see README for how to set this env var.
        if not expected_secret or provided_secret != expected_secret:
            return Response({'detail': 'Invalid webhook secret.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            event = request.data['event']
            event_type = event['type']
            app_user_id = str(event['app_user_id'])
        except (KeyError, TypeError):
            return Response({'detail': 'Unparseable webhook payload.'}, status=status.HTTP_400_BAD_REQUEST)

        # app_user_id is str(user.id) — the frontend configures RevenueCat's
        # SDK with `Purchases.configure({..., appUserID: String(currentUser.id)})`,
        # so it's always our own numeric primary key as a string.
        try:
            user = User.objects.get(pk=int(app_user_id))
        except (ValueError, User.DoesNotExist):
            # Orphaned event (e.g. sandbox testing, or the user was deleted)
            # — log and 200 anyway. RC retries aggressively on non-2xx, and
            # there's nothing useful to retry into here.
            logger.warning('RevenueCat webhook: no user for app_user_id=%r (event=%s)', app_user_id, event_type)
            return Response(status=status.HTTP_200_OK)

        entitlement, _ = Entitlement.objects.get_or_create(user=user)
        entitlement.revenuecat_user_id = app_user_id

        expiration_at_ms = event.get('expiration_at_ms')
        expires_at = None
        if expiration_at_ms is not None:
            expires_at = datetime.fromtimestamp(expiration_at_ms / 1000, tz=dt_timezone.utc)

        if event_type in _ACTIVE_EVENT_TYPES:
            entitlement.status = Entitlement.STATUS_ACTIVE
            entitlement.expires_at = expires_at
        elif event_type == 'TRIAL_STARTED':
            entitlement.status = Entitlement.STATUS_TRIALING
            entitlement.expires_at = expires_at
        elif event_type == 'EXPIRATION':
            entitlement.status = Entitlement.STATUS_EXPIRED
        elif event_type == 'NON_RENEWING_PURCHASE':
            entitlement.is_lifetime = True
        elif event_type == 'CANCELLATION':
            # Still active until the real EXPIRATION event arrives at term
            # end — cancellation just turns off auto-renew.
            logger.info('RevenueCat webhook: CANCELLATION for user=%s (no-op)', user.id)
            return Response(status=status.HTTP_200_OK)
        else:
            # Forward-compatible: unknown event types are a no-op, not an error.
            logger.info('RevenueCat webhook: unhandled event type %r for user=%s', event_type, user.id)
            return Response(status=status.HTTP_200_OK)

        entitlement.save()
        return Response(status=status.HTTP_200_OK)
