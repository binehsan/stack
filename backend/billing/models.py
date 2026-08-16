from django.conf import settings
from django.db import models
from django.utils import timezone

# Free-tier caps and Pro quotas. Kept here (not settings.py) since they're
# product/business constants, not deployment config — see README's Billing
# section for the product rationale behind each number.
FREE_GROUP_FOUND_LIMIT = 1
FREE_DEVICE_LIMIT = 1
PRO_VOICE_MONTHLY_LIMIT = 200
# Applies to every group stack regardless of tier — abuse prevention, not a
# paywall (see paywall spec section 4). Enforced in family/views.py.
GROUP_MEMBER_ABUSE_CAP = 20


class Entitlement(models.Model):
    """The backend's source of truth for a user's Stack Pro status. Never
    trust a client-side flag for anything that gates cost or data — this is
    what every paywalled endpoint checks, and what RevenueCat's webhook
    updates (see billing/views.py's RevenueCatWebhookView)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='entitlement'
    )

    STATUS_FREE = 'free'
    STATUS_ACTIVE = 'active'
    STATUS_TRIALING = 'trialing'
    STATUS_CANCELLED = 'cancelled'
    STATUS_EXPIRED = 'expired'
    STATUS_CHOICES = [
        (STATUS_FREE, 'Free'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_TRIALING, 'Trialing'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_EXPIRED, 'Expired'),
    ]
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_FREE)
    expires_at = models.DateTimeField(null=True, blank=True)
    # The one-time "lifetime unlock" non-consumable purchase — always pro,
    # regardless of status/expires_at.
    is_lifetime = models.BooleanField(default=False)
    # The app_user_id RevenueCat's SDK was configured with on the client —
    # str(user.id), see RevenueCatWebhookView for the assumption this rests on.
    revenuecat_user_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user} ({self.status})'

    @property
    def is_pro(self):
        if self.is_lifetime:
            return True
        if self.status in (self.STATUS_ACTIVE, self.STATUS_TRIALING):
            return self.expires_at is None or self.expires_at > timezone.now()
        return False


class Device(models.Model):
    """One synced device for a user. Free tier caps this at
    FREE_DEVICE_LIMIT (see accounts/views.py Login/Register); Pro is
    unlimited. `device_id` is whatever stable identifier the frontend
    generates/persists on-device — we don't care about its shape."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='devices')
    device_id = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'device_id')]

    def __str__(self):
        return f'{self.user} / {self.device_id}'


class VoiceCapture(models.Model):
    """One row per voice-input use, purely for quota accounting (see
    PRO_VOICE_MONTHLY_LIMIT). No speech-to-text actually happens here — this
    is a reservation stub for a mic feature the frontend will wire up later.
    Quota resets on the calendar month: we count rows created in the current
    month rather than maintaining a separate counter + reset-date field,
    which avoids reset-race bugs entirely."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='voice_captures'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user} @ {self.created_at}'


def get_or_create_entitlement(user):
    """Every user needs an Entitlement, but it's created lazily on first
    access (read or write) rather than backfilled in a migration — simpler,
    and works for users created before this app existed too."""
    entitlement, _ = Entitlement.objects.get_or_create(user=user)
    return entitlement
