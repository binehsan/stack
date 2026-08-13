from rest_framework import serializers

from .models import GroupInvite, GroupMembership, GroupStack, GroupTask


class UserSummarySerializer(serializers.Serializer):
    """A lightweight view of a User + their Profile, for showing "who" next
    to a group task or in a member list — id, handle, avatar, nothing else.
    """

    id = serializers.IntegerField()
    email = serializers.EmailField()
    username = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    def get_username(self, user):
        return user.profile.username

    def get_avatar(self, user):
        avatar = user.profile.avatar
        if not avatar:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(avatar.url) if request else avatar.url


class GroupStackSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = GroupStack
        fields = ['id', 'name', 'image', 'created_at', 'members']

    def get_members(self, stack):
        memberships = GroupMembership.objects.filter(stack=stack).select_related(
            'user__profile'
        )
        return UserSummarySerializer(
            [m.user for m in memberships], many=True, context=self.context
        ).data

    def get_image(self, stack):
        if not stack.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(stack.image.url) if request else stack.image.url


class GroupStackUpdateSerializer(serializers.ModelSerializer):
    """Separate from GroupStackSerializer (read-shape, computed fields) —
    this is the writable subset for the name/image PATCH endpoint."""

    class Meta:
        model = GroupStack
        fields = ['name', 'image']
        extra_kwargs = {
            'name': {'required': False},
            'image': {'required': False, 'allow_null': True},
        }

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Give your group stack a name.')
        return value


class GroupInviteSerializer(serializers.ModelSerializer):
    stack_name = serializers.CharField(source='stack.name', read_only=True)
    invited_by_username = serializers.CharField(source='invited_by.profile.username', read_only=True)

    class Meta:
        model = GroupInvite
        fields = ['id', 'stack', 'stack_name', 'invited_by_username', 'status', 'created_at']
        read_only_fields = fields


class GroupTaskSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)
    assigned_to = UserSummarySerializer(read_only=True)

    class Meta:
        model = GroupTask
        fields = ['id', 'text', 'completed', 'created_by', 'assigned_to', 'created_at']
        read_only_fields = ['id', 'created_by', 'assigned_to', 'created_at']
