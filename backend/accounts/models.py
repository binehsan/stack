from django.conf import settings
from django.db import models


def generate_unique_username(email):
    """Derive a default @handle from the email's local part, disambiguating
    with a numeric suffix if it's taken. Users can change it later."""
    base = ''.join(ch for ch in email.split('@')[0].lower() if ch.isalnum() or ch == '_')
    base = (base or 'user')[:24]
    candidate = base
    suffix = 0
    while Profile.objects.filter(username=candidate).exists():
        suffix += 1
        candidate = f'{base}{suffix}'
    return candidate


def clean_username(value):
    """Normalize and shape-check a candidate @handle. Returns the cleaned
    value, or raises ValueError with a human-readable message. Doesn't check
    uniqueness — see `username_taken` — since callers need the cleaned value
    first to check it against the right exclusion (e.g. excluding self on a
    profile edit)."""
    value = value.strip().lower()
    if not value:
        raise ValueError('Username cannot be empty.')
    if not all(ch.isalnum() or ch == '_' for ch in value):
        raise ValueError('Usernames can only contain letters, numbers, and underscores.')
    return value


def username_taken(value, exclude_pk=None):
    existing = Profile.objects.filter(username=value)
    if exclude_pk is not None:
        existing = existing.exclude(pk=exclude_pk)
    return existing.exists()


class Profile(models.Model):
    """Extends Django's built-in User with app-specific, non-auth fields —
    kept as a separate model rather than a custom User model since it's an
    additive concern (avatar, handle, reset time), not a change to auth."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile'
    )
    username = models.CharField(max_length=30, unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    # Hour (0-23) the daily stack resets at, in the server's configured
    # TIME_ZONE. 0 = midnight (the original behavior).
    reset_hour = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f'@{self.username}'


class PushToken(models.Model):
    """An Expo push token for one of a user's devices. FK, not OneToOne —
    a user may have the app installed on more than one device, and each
    should get nudged."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_tokens'
    )
    token = models.CharField(max_length=200, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.token
