from django.contrib.auth import authenticate
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PushToken
from .serializers import (
    ChangePasswordSerializer,
    ProfileSerializer,
    PushTokenSerializer,
    RegisterSerializer,
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

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_tokens_for(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

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
