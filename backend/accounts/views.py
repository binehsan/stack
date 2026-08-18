from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .emails import send_branded_email
from .models import PushToken, WebPushSubscription
from .serializers import (
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileSerializer,
    PushTokenSerializer,
    RegisterSerializer,
    WebPushSubscriptionSerializer,
)


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'email': user.email,
        'username': user.profile.username,
    }


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    # Keyed per-IP by DRF's ScopedRateThrottle (see REST_FRAMEWORK's
    # DEFAULT_THROTTLE_RATES) — there's no user yet to key on, and per-IP is
    # exactly what stops a signup-spam/credential-stuffing loop.
    throttle_scope = 'auth'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_tokens_for(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password') or ''
        user = authenticate(username=email, password=password)
        if user is None:
            return Response(
                {'detail': 'Incorrect email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(_tokens_for(user))


class ChangePasswordView(APIView):
    # Uses the global default (IsAuthenticated) — this is account-holder-only.

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/ — starts a reset. Always returns the
    same generic response whether or not the email is registered; a
    response that varied would let anyone use this endpoint to check which
    emails have accounts."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()

        # email doubles as username (see RegisterSerializer) — same lookup
        # LoginView uses via authenticate(username=email, ...).
        user = User.objects.filter(username=email).first()
        if user is not None:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f'{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}'
            send_branded_email(
                user.email,
                'Reset your Stack password',
                'emails/password_reset.html',
                {'reset_url': reset_url, 'username': user.profile.username},
            )

        return Response({'detail': 'If that email has an account, a reset link is on its way.'})


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset-confirm/ — the link from that email
    lands on the website's /reset-password page, which posts uid+token+new
    password here. default_token_generator (Django's own, also used by the
    built-in admin password reset) ties the token to the user's current
    password hash and last_login, so it stops working the moment it's used
    once or the password changes any other way — no separate "used" flag
    needed. Tokens expire after PASSWORD_RESET_TIMEOUT (Django default: 3
    days), matching what the email tells the recipient.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is None or not default_token_generator.check_token(user, data['token']):
            return Response(
                {'detail': 'This reset link is invalid or has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(data['new_password'])
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeleteAccountView(APIView):
    def delete(self, request):
        password = request.data.get('password') or ''
        if not request.user.check_password(password):
            return Response({'detail': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.delete()  # cascades to their tasks (Task.user is on_delete=CASCADE)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = ProfileSerializer(request.user.profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileSerializer(
            request.user.profile, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RegisterPushTokenView(APIView):
    """Registers (or re-owns) an Expo push token for the caller's device.
    Upsert on `token`, not create-only: the same physical device's token is
    stable across app reinstalls/logins, so a second registration (e.g.
    after switching accounts on one phone) should reassign it rather than
    fail on the uniqueness constraint."""

    def post(self, request):
        serializer = PushTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        PushToken.objects.update_or_create(token=token, defaults={'user': request.user})
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterWebPushSubscriptionView(APIView):
    """Registers (or re-owns) the PWA's Web Push subscription for the
    caller's browser — the web equivalent of RegisterPushTokenView above.
    Accepts the browser's PushSubscription.toJSON() shape directly
    (`{endpoint, keys: {p256dh, auth}}`) so the frontend doesn't need to
    reshape it before posting. Upsert on `endpoint`, same reasoning as
    PushToken's upsert on `token`."""

    def post(self, request):
        keys = request.data.get('keys') or {}
        serializer = WebPushSubscriptionSerializer(
            data={
                'endpoint': request.data.get('endpoint'),
                'p256dh': keys.get('p256dh'),
                'auth': keys.get('auth'),
            }
        )
        serializer.is_valid(raise_exception=True)
        WebPushSubscription.objects.update_or_create(
            endpoint=serializer.validated_data['endpoint'],
            defaults={
                'user': request.user,
                'p256dh': serializer.validated_data['p256dh'],
                'auth': serializer.validated_data['auth'],
            },
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnregisterWebPushSubscriptionView(APIView):
    """Removes a Web Push subscription — called when the caller turns
    notifications off in Settings. Silently no-ops on an unknown endpoint
    (already gone is the same end state as successfully removed)."""

    def post(self, request):
        endpoint = request.data.get('endpoint')
        if endpoint:
            WebPushSubscription.objects.filter(endpoint=endpoint, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
