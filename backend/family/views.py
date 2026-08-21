from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.webpush import send_web_push
from tasks.views import compute_stats

from .models import GROUP_MEMBER_ABUSE_CAP, GroupInvite, GroupMembership, GroupStack, GroupTask
from .push import send_expo_push
from .serializers import (
    GroupInviteSerializer,
    GroupStackSerializer,
    GroupStackUpdateSerializer,
    GroupTaskSerializer,
    UserSummarySerializer,
)


def _my_memberships(user):
    return GroupMembership.objects.filter(user=user).select_related('stack')


def _membership_for(user, stack_id):
    """The caller's membership in a specific stack, or None — this is both
    the "do they belong here" check and the lookup, since with multiple
    stacks per user every stack-scoped endpoint needs to verify membership
    before touching anything (unlike the old single-stack design, where
    `_my_membership` alone was enough context)."""
    return GroupMembership.objects.filter(user=user, stack_id=stack_id).select_related('stack').first()


def _normalize_username(raw):
    return (raw or '').strip().lstrip('@').lower()


class MyGroupStacksView(APIView):
    def get(self, request):
        stacks = [m.stack for m in _my_memberships(request.user)]
        return Response(GroupStackSerializer(stacks, many=True, context={'request': request}).data)


class CreateGroupStackView(APIView):
    def post(self, request):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'detail': 'Give your group stack a name.'}, status=status.HTTP_400_BAD_REQUEST)

        stack = GroupStack.objects.create(name=name, created_by=request.user)
        GroupMembership.objects.create(stack=stack, user=request.user)
        return Response(
            GroupStackSerializer(stack, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class GroupStackDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, stack_id):
        membership = _membership_for(request.user, stack_id)
        if not membership:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(GroupStackSerializer(membership.stack, context={'request': request}).data)

    def patch(self, request, stack_id):
        membership = _membership_for(request.user, stack_id)
        if not membership:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = GroupStackUpdateSerializer(membership.stack, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        stack = serializer.save()
        return Response(GroupStackSerializer(stack, context={'request': request}).data)


class LeaveGroupStackView(APIView):
    def post(self, request, stack_id):
        membership = _membership_for(request.user, stack_id)
        if not membership:
            return Response(
                {'detail': "You're not in that group stack."}, status=status.HTTP_400_BAD_REQUEST
            )
        stack = membership.stack
        membership.delete()
        if not stack.memberships.exists():
            stack.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupInviteListView(APIView):
    def get(self, request):
        invites = GroupInvite.objects.filter(
            invited_user=request.user, status=GroupInvite.STATUS_PENDING
        ).select_related('stack', 'invited_by__profile')
        return Response(GroupInviteSerializer(invites, many=True).data)


class SendGroupInviteView(APIView):
    def post(self, request, stack_id):
        membership = _membership_for(request.user, stack_id)
        if not membership:
            return Response(
                {'detail': "You're not a member of this group stack."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = _normalize_username(request.data.get('username'))
        if not username:
            return Response({'detail': 'Enter a username to invite.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invited_user = User.objects.get(profile__username=username)
        except User.DoesNotExist:
            return Response(
                {'detail': f'No user found with username @{username}.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if invited_user.id == request.user.id:
            return Response({'detail': "You can't invite yourself."}, status=status.HTTP_400_BAD_REQUEST)

        if GroupMembership.objects.filter(stack=membership.stack, user=invited_user).exists():
            return Response(
                {'detail': "They're already in this group stack."}, status=status.HTTP_400_BAD_REQUEST
            )

        invite, created = GroupInvite.objects.get_or_create(
            stack=membership.stack,
            invited_user=invited_user,
            status=GroupInvite.STATUS_PENDING,
            defaults={'invited_by': request.user},
        )
        if not created:
            return Response(
                {'detail': 'They already have a pending invite to this stack.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # This was the one push notification the app never actually sent —
        # NudgeGroupTaskView has always pushed on assignment, but an invite
        # sat silently in `/api/groups/invites/` until the invitee happened
        # to open the app and check.
        send_expo_push(
            invited_user.push_tokens.values_list('token', flat=True),
            title=f'@{request.user.profile.username} invited you',
            body=f'Join "{membership.stack.name}"\'s groupStack',
            data={'stackId': membership.stack.id, 'inviteId': invite.id},
        )
        send_web_push(
            invited_user.webpush_subscriptions.all(),
            title=f'@{request.user.profile.username} invited you',
            body=f'Join "{membership.stack.name}"\'s groupStack',
            data={'stackId': membership.stack.id, 'inviteId': invite.id},
        )

        return Response(GroupInviteSerializer(invite).data, status=status.HTTP_201_CREATED)


class RespondGroupInviteView(APIView):
    def post(self, request, invite_id):
        try:
            invite = GroupInvite.objects.get(
                id=invite_id, invited_user=request.user, status=GroupInvite.STATUS_PENDING
            )
        except GroupInvite.DoesNotExist:
            return Response({'detail': 'Invite not found.'}, status=status.HTTP_404_NOT_FOUND)

        response_action = request.data.get('action')
        if response_action == 'decline':
            invite.status = GroupInvite.STATUS_DECLINED
            invite.save()
            return Response(status=status.HTTP_204_NO_CONTENT)

        if response_action != 'accept':
            return Response(
                {'detail': 'action must be "accept" or "decline".'}, status=status.HTTP_400_BAD_REQUEST
            )

        # Abuse-prevention cap, not a paywall — applies to every stack
        # regardless of either party's tier (see billing app docs). Checked
        # before accepting so a full stack doesn't silently accept and then
        # go over.
        if GroupMembership.objects.filter(stack=invite.stack).count() >= GROUP_MEMBER_ABUSE_CAP:
            return Response(
                {'detail': 'This group stack is full (20 members max).', 'code': 'GROUP_MEMBER_CAP'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invite.status = GroupInvite.STATUS_ACCEPTED
        invite.save()
        # get_or_create, not create: a user could already be a member (e.g.
        # re-accepting a stale invite) now that multiple memberships are
        # allowed — the unique_membership_per_stack constraint would
        # otherwise raise on a plain create().
        GroupMembership.objects.get_or_create(stack=invite.stack, user=request.user)
        return Response(GroupStackSerializer(invite.stack, context={'request': request}).data)


class GroupTaskListView(APIView):
    def get(self, request, stack_id):
        membership = _membership_for(request.user, stack_id)
        if not membership:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        tasks = GroupTask.objects.filter(stack=membership.stack).select_related(
            'created_by__profile', 'assigned_to__profile'
        )
        return Response(GroupTaskSerializer(tasks, many=True, context={'request': request}).data)

    def post(self, request, stack_id):
        membership = _membership_for(request.user, stack_id)
        if not membership:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = GroupTaskSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        task = serializer.save(stack=membership.stack, created_by=request.user)
        return Response(
            GroupTaskSerializer(task, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class GroupTaskDetailView(APIView):
    def _get_task(self, request, stack_id, task_id):
        if not _membership_for(request.user, stack_id):
            return None
        return GroupTask.objects.filter(stack_id=stack_id, id=task_id).first()

    def patch(self, request, stack_id, task_id):
        task = self._get_task(request, stack_id, task_id)
        if not task:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = GroupTaskSerializer(
            task, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(GroupTaskSerializer(task, context={'request': request}).data)

    def delete(self, request, stack_id, task_id):
        task = self._get_task(request, stack_id, task_id)
        if not task:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMemberProfileView(APIView):
    """A group-stack member's profile: avatar/username/member-since, always,
    plus their stats block if — and only if — they've opted in via
    Profile.share_stats_with_groups. Both the caller and the target must
    belong to the stack (checked via `_membership_for` for each), so a
    viewer can only see profiles of people they actually share a Group
    Stack with; a stack the caller isn't in, or a user who isn't in that
    stack, both return the same "Not found" a non-member would get poking
    at any other stack-scoped endpoint here, rather than a 403 that would
    leak the stack's existence."""

    def get(self, request, stack_id, user_id):
        if not _membership_for(request.user, stack_id):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        target_membership = GroupMembership.objects.filter(
            user_id=user_id, stack_id=stack_id
        ).select_related('user__profile').first()
        if not target_membership:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        target_user = target_membership.user
        profile = target_user.profile
        data = {
            'id': target_user.id,
            'username': profile.username,
            'avatar': UserSummarySerializer(target_user, context={'request': request}).data['avatar'],
            'member_since': target_user.date_joined.date().isoformat(),
            'stats': compute_stats(target_user) if profile.share_stats_with_groups else None,
        }
        return Response(data)


class NudgeGroupTaskView(APIView):
    def post(self, request, stack_id, task_id):
        if not _membership_for(request.user, stack_id):
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        task = GroupTask.objects.filter(stack_id=stack_id, id=task_id).first()
        if not task:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        username = _normalize_username(request.data.get('username'))

        if not username:
            task.assigned_to = None
            task.save(update_fields=['assigned_to'])
            return Response(GroupTaskSerializer(task, context={'request': request}).data)

        try:
            target = User.objects.get(profile__username=username)
        except User.DoesNotExist:
            return Response(
                {'detail': f'No user found with username @{username}.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not GroupMembership.objects.filter(stack=task.stack, user=target).exists():
            return Response(
                {'detail': "They're not a member of this group stack."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task.assigned_to = target
        task.save(update_fields=['assigned_to'])

        send_expo_push(
            target.push_tokens.values_list('token', flat=True),
            title=f'You have been nudged in {task.stack.name} groupStack 🗣️',
            body=task.text,
            data={'stackId': task.stack_id, 'taskId': task.id},
        )
        send_web_push(
            target.webpush_subscriptions.all(),
            title=f'You have been nudged in {task.stack.name} groupStack🗣️',
            body=task.text,
            data={'stackId': task.stack_id, 'taskId': task.id},
        )

        return Response(GroupTaskSerializer(task, context={'request': request}).data)
