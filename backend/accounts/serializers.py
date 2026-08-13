from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Profile, PushToken, clean_username, generate_unique_username, username_taken


class RegisterSerializer(serializers.Serializer):
    """Email + password, plus an optional chosen @handle — no email
    verification. If `username` is left blank, one is auto-generated from
    the email (same fallback Profile always had).

    The email doubles as Django's `username` (unique, case-normalized) so we
    don't need a custom User model just to swap the login identifier. The
    @handle used for group-stack invites lives on Profile instead.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_username(self, value):
        if not value:
            return value
        try:
            value = clean_username(value)
        except ValueError as err:
            raise serializers.ValidationError(str(err))
        if username_taken(value):
            raise serializers.ValidationError('That username is taken.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': "Passwords don't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        chosen_username = validated_data.get('username') or generate_unique_username(
            validated_data['email']
        )
        Profile.objects.create(user=user, username=chosen_username)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': "Passwords don't match."})
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = ['username', 'avatar', 'reset_hour', 'email']
        extra_kwargs = {'avatar': {'required': False, 'allow_null': True}}

    def validate_username(self, value):
        try:
            value = clean_username(value)
        except ValueError as err:
            raise serializers.ValidationError(str(err))
        exclude_pk = self.instance.pk if self.instance else None
        if username_taken(value, exclude_pk=exclude_pk):
            raise serializers.ValidationError('That username is taken.')
        return value

    def validate_reset_hour(self, value):
        if not 0 <= value <= 23:
            raise serializers.ValidationError('Reset hour must be between 0 and 23.')
        return value


class PushTokenSerializer(serializers.ModelSerializer):
    # Declared explicitly (not left to ModelSerializer's auto-generation) to
    # skip the UniqueValidator it would otherwise attach for a unique=True
    # model field — this endpoint deliberately upserts on `token`
    # (see RegisterPushTokenView), so re-registering the same token is the
    # expected, valid case, not a validation error.
    token = serializers.CharField(max_length=200)

    class Meta:
        model = PushToken
        fields = ['token']
