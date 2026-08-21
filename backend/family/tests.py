from io import BytesIO

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Profile

from .models import GroupInvite, GroupMembership, GroupStack, GroupTask


def make_user(email, password='testpass123', username=None):
    user = User.objects.create_user(username=email, email=email, password=password)
    Profile.objects.create(user=user, username=username or email.split('@')[0])
    return user


def make_test_image(name='stack.png'):
    buf = BytesIO()
    Image.new('RGB', (8, 8), color='blue').save(buf, format='PNG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/png')


class CreateAndListGroupStacksTests(APITestCase):
    def test_create_requires_a_name(self):
        user = make_user('noname@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.post('/api/groups/create/', {'name': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_creator_becomes_first_member(self):
        user = make_user('creator@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.post('/api/groups/create/', {'name': 'Roomies'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['members']), 1)
        stack_id = response.data['id']
        self.assertTrue(GroupMembership.objects.filter(stack_id=stack_id, user=user).exists())

    def test_mine_only_lists_stacks_the_caller_belongs_to(self):
        member = make_user('member@example.com')
        outsider = make_user('outsider@example.com')
        self.client.force_authenticate(user=member)
        self.client.post('/api/groups/create/', {'name': 'Insiders'})

        self.client.force_authenticate(user=outsider)
        response = self.client.get('/api/groups/mine/')
        self.assertEqual(response.data, [])


class GroupStackDetailTests(APITestCase):
    def test_non_member_cannot_view(self):
        founder = make_user('founder2@example.com')
        outsider = make_user('outsider2@example.com')
        stack = GroupStack.objects.create(name='Private', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)

        self.client.force_authenticate(user=outsider)
        response = self.client.get(f'/api/groups/{stack.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_member_can_update_name(self):
        founder = make_user('renamer2@example.com')
        stack = GroupStack.objects.create(name='Old Name', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.patch(f'/api/groups/{stack.id}/', {'name': 'New Name'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'New Name')

    def test_member_can_update_image(self):
        founder = make_user('photographer@example.com')
        stack = GroupStack.objects.create(name='Photo Stack', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.patch(
            f'/api/groups/{stack.id}/', {'image': make_test_image()}, format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['image'])


class LeaveGroupStackTests(APITestCase):
    def test_leaving_removes_membership(self):
        founder = make_user('leaver1@example.com')
        other = make_user('stayer1@example.com')
        stack = GroupStack.objects.create(name='Two People', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=other)
        self.client.force_authenticate(user=founder)

        response = self.client.post(f'/api/groups/{stack.id}/leave/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupMembership.objects.filter(stack=stack, user=founder).exists())
        # Stack survives since another member remains.
        self.assertTrue(GroupStack.objects.filter(pk=stack.pk).exists())

    def test_last_member_leaving_deletes_the_stack(self):
        founder = make_user('lastleaver@example.com')
        stack = GroupStack.objects.create(name='Solo', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.post(f'/api/groups/{stack.id}/leave/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupStack.objects.filter(pk=stack.pk).exists())

    def test_leaving_a_stack_youre_not_in_fails(self):
        outsider = make_user('notmember@example.com')
        founder = make_user('someoneelse@example.com')
        stack = GroupStack.objects.create(name='Not Yours', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=outsider)

        response = self.client.post(f'/api/groups/{stack.id}/leave/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GroupInviteTests(APITestCase):
    def test_invite_list_only_shows_pending_invites_for_caller(self):
        founder = make_user('inviter1@example.com')
        invitee = make_user('invitee1@example.com')
        other = make_user('notinvited@example.com')
        stack = GroupStack.objects.create(name='Invite Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupInvite.objects.create(stack=stack, invited_user=invitee, invited_by=founder)

        self.client.force_authenticate(user=other)
        response = self.client.get('/api/groups/invites/')
        self.assertEqual(response.data, [])

        self.client.force_authenticate(user=invitee)
        response = self.client.get('/api/groups/invites/')
        self.assertEqual(len(response.data), 1)

    def test_send_invite_success(self):
        founder = make_user('sender1@example.com')
        invitee = make_user('receiver1@example.com', username='receiver')
        stack = GroupStack.objects.create(name='Send Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.post(f'/api/groups/{stack.id}/invite/', {'username': 'receiver'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            GroupInvite.objects.filter(
                stack=stack, invited_user=invitee, status=GroupInvite.STATUS_PENDING
            ).exists()
        )

    def test_send_invite_accepts_at_prefixed_username(self):
        founder = make_user('atsender@example.com')
        make_user('atreceiver@example.com', username='athandle')
        stack = GroupStack.objects.create(name='At Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.post(f'/api/groups/{stack.id}/invite/', {'username': '@AtHandle'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_non_member_cannot_send_invite(self):
        founder = make_user('realfounder@example.com')
        outsider = make_user('fakeinviter@example.com')
        make_user('target1@example.com', username='target1')
        stack = GroupStack.objects.create(name='Not Member', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=outsider)

        response = self.client.post(f'/api/groups/{stack.id}/invite/', {'username': 'target1'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_invite_self(self):
        founder = make_user('selfinviter@example.com', username='selfinviter')
        stack = GroupStack.objects.create(name='Self Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.post(f'/api/groups/{stack.id}/invite/', {'username': 'selfinviter'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_invite_existing_member(self):
        founder = make_user('existingfounder@example.com')
        member = make_user('existingmember@example.com', username='existingmember')
        stack = GroupStack.objects.create(name='Already In', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=member)
        self.client.force_authenticate(user=founder)

        response = self.client.post(f'/api/groups/{stack.id}/invite/', {'username': 'existingmember'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inviting_unknown_username_404s(self):
        founder = make_user('ghosttarget@example.com')
        stack = GroupStack.objects.create(name='Ghost', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.post(f'/api/groups/{stack.id}/invite/', {'username': 'nobodyhome'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_duplicate_pending_invite_is_rejected(self):
        founder = make_user('dupfounder@example.com')
        make_user('duptarget@example.com', username='duptarget')
        stack = GroupStack.objects.create(name='Dup Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        first = self.client.post(f'/api/groups/{stack.id}/invite/', {'username': 'duptarget'})
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.client.post(f'/api/groups/{stack.id}/invite/', {'username': 'duptarget'})
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)


class RespondGroupInviteTests(APITestCase):
    def test_accept_creates_membership_and_returns_stack(self):
        founder = make_user('acceptfounder@example.com')
        invitee = make_user('acceptinvitee@example.com')
        stack = GroupStack.objects.create(name='Accept Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        invite = GroupInvite.objects.create(stack=stack, invited_user=invitee, invited_by=founder)
        self.client.force_authenticate(user=invitee)

        response = self.client.post(f'/api/groups/invites/{invite.id}/respond/', {'action': 'accept'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], stack.id)
        self.assertTrue(GroupMembership.objects.filter(stack=stack, user=invitee).exists())
        invite.refresh_from_db()
        self.assertEqual(invite.status, GroupInvite.STATUS_ACCEPTED)

    def test_decline_marks_declined_without_membership(self):
        founder = make_user('declinefounder@example.com')
        invitee = make_user('declineinvitee@example.com')
        stack = GroupStack.objects.create(name='Decline Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        invite = GroupInvite.objects.create(stack=stack, invited_user=invitee, invited_by=founder)
        self.client.force_authenticate(user=invitee)

        response = self.client.post(f'/api/groups/invites/{invite.id}/respond/', {'action': 'decline'})
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupMembership.objects.filter(stack=stack, user=invitee).exists())
        invite.refresh_from_db()
        self.assertEqual(invite.status, GroupInvite.STATUS_DECLINED)

    def test_invalid_action_is_rejected(self):
        founder = make_user('invalidfounder@example.com')
        invitee = make_user('invalidinvitee@example.com')
        stack = GroupStack.objects.create(name='Invalid Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        invite = GroupInvite.objects.create(stack=stack, invited_user=invitee, invited_by=founder)
        self.client.force_authenticate(user=invitee)

        response = self.client.post(
            f'/api/groups/invites/{invite.id}/respond/', {'action': 'maybe-later'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_responding_to_someone_elses_invite_404s(self):
        founder = make_user('wrongrecipientfounder@example.com')
        invitee = make_user('realrecipient@example.com')
        snoop = make_user('snoop@example.com')
        stack = GroupStack.objects.create(name='Not Yours Either', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        invite = GroupInvite.objects.create(stack=stack, invited_user=invitee, invited_by=founder)
        self.client.force_authenticate(user=snoop)

        response = self.client.post(f'/api/groups/invites/{invite.id}/respond/', {'action': 'accept'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_already_responded_invite_cannot_be_responded_to_again(self):
        founder = make_user('alreadyfounder@example.com')
        invitee = make_user('alreadyinvitee@example.com')
        stack = GroupStack.objects.create(name='Already Responded', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        invite = GroupInvite.objects.create(
            stack=stack, invited_user=invitee, invited_by=founder, status=GroupInvite.STATUS_DECLINED
        )
        self.client.force_authenticate(user=invitee)

        response = self.client.post(f'/api/groups/invites/{invite.id}/respond/', {'action': 'accept'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_re_accepting_while_already_a_member_does_not_error(self):
        # get_or_create, not create — a stale pending invite accepted after
        # the user is already a member (e.g. re-joined another way) must not
        # crash on the unique_membership_per_stack constraint.
        founder = make_user('rejoinfounder@example.com')
        invitee = make_user('rejoininvitee@example.com')
        stack = GroupStack.objects.create(name='Rejoin Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=invitee)
        invite = GroupInvite.objects.create(stack=stack, invited_user=invitee, invited_by=founder)
        self.client.force_authenticate(user=invitee)

        response = self.client.post(f'/api/groups/invites/{invite.id}/respond/', {'action': 'accept'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(GroupMembership.objects.filter(stack=stack, user=invitee).count(), 1)


class GroupTaskTests(APITestCase):
    def test_non_member_cannot_list_or_create_tasks(self):
        founder = make_user('taskfounder@example.com')
        outsider = make_user('taskoutsider@example.com')
        stack = GroupStack.objects.create(name='Task Privacy', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=outsider)

        get_response = self.client.get(f'/api/groups/{stack.id}/tasks/')
        self.assertEqual(get_response.status_code, status.HTTP_404_NOT_FOUND)
        post_response = self.client.post(f'/api/groups/{stack.id}/tasks/', {'text': 'Sneaky'})
        self.assertEqual(post_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_member_can_create_list_update_delete_task(self):
        founder = make_user('taskcrud@example.com')
        stack = GroupStack.objects.create(name='Task CRUD', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        created = self.client.post(f'/api/groups/{stack.id}/tasks/', {'text': 'Take out trash'})
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        task_id = created.data['id']

        listing = self.client.get(f'/api/groups/{stack.id}/tasks/')
        self.assertEqual(len(listing.data), 1)

        patched = self.client.patch(
            f'/api/groups/{stack.id}/tasks/{task_id}/', {'completed': True}, format='json'
        )
        self.assertEqual(patched.status_code, status.HTTP_200_OK)
        self.assertTrue(patched.data['completed'])

        deleted = self.client.delete(f'/api/groups/{stack.id}/tasks/{task_id}/')
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupTask.objects.filter(pk=task_id).exists())

    def test_any_member_can_see_and_edit_tasks_not_just_creator(self):
        founder = make_user('sharedfounder@example.com')
        member = make_user('sharedmember@example.com')
        stack = GroupStack.objects.create(name='Shared Tasks', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=member)

        self.client.force_authenticate(user=founder)
        created = self.client.post(f'/api/groups/{stack.id}/tasks/', {'text': 'Shared chore'})
        task_id = created.data['id']

        self.client.force_authenticate(user=member)
        patched = self.client.patch(
            f'/api/groups/{stack.id}/tasks/{task_id}/', {'completed': True}, format='json'
        )
        self.assertEqual(patched.status_code, status.HTTP_200_OK)


class GroupMemberProfileTests(APITestCase):
    def test_groupmate_sees_member_since_without_opting_in(self):
        founder = make_user('profilefounder@example.com')
        member = make_user('profilemember@example.com')
        stack = GroupStack.objects.create(name='Profile Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=member)
        self.client.force_authenticate(user=founder)

        response = self.client.get(f'/api/groups/{stack.id}/members/{member.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], member.id)
        self.assertEqual(response.data['username'], member.profile.username)
        self.assertEqual(response.data['member_since'], member.date_joined.date().isoformat())
        self.assertIsNone(response.data['stats'])

    def test_groupmate_sees_stats_only_when_target_opted_in(self):
        founder = make_user('statsfounder@example.com')
        member = make_user('statsmember@example.com')
        stack = GroupStack.objects.create(name='Stats Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=member)
        member.profile.share_stats_with_groups = True
        member.profile.save()
        self.client.force_authenticate(user=founder)

        response = self.client.get(f'/api/groups/{stack.id}/members/{member.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['stats'])
        self.assertIn('current_streak', response.data['stats'])
        self.assertIn('total_completed', response.data['stats'])

    def test_non_groupmate_gets_404(self):
        founder = make_user('privatefounder@example.com')
        member = make_user('privatemember@example.com')
        outsider = make_user('profileoutsider@example.com')
        stack = GroupStack.objects.create(name='Private Profile', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=member)
        self.client.force_authenticate(user=outsider)

        response = self.client.get(f'/api/groups/{stack.id}/members/{member.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_target_not_in_stack_gets_404(self):
        founder = make_user('soloprofilefounder@example.com')
        elsewhere = make_user('elsewheremember@example.com')
        stack = GroupStack.objects.create(name='Solo Profile Stack', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.get(f'/api/groups/{stack.id}/members/{elsewhere.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class NudgeGroupTaskTests(APITestCase):
    def test_nudge_assigns_task_to_member(self):
        founder = make_user('nudgefounder@example.com')
        target = make_user('nudgetarget@example.com', username='nudgetarget')
        stack = GroupStack.objects.create(name='Nudge Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=target)
        task = GroupTask.objects.create(stack=stack, text='Do this', created_by=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.post(
            f'/api/groups/{stack.id}/tasks/{task.id}/nudge/', {'username': 'nudgetarget'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.assigned_to, target)

    def test_nudge_with_blank_username_clears_assignment(self):
        founder = make_user('clearfounder@example.com')
        target = make_user('cleartarget@example.com')
        stack = GroupStack.objects.create(name='Clear Test', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        GroupMembership.objects.create(stack=stack, user=target)
        task = GroupTask.objects.create(
            stack=stack, text='Assigned', created_by=founder, assigned_to=target
        )
        self.client.force_authenticate(user=founder)

        response = self.client.post(f'/api/groups/{stack.id}/tasks/{task.id}/nudge/', {'username': ''})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertIsNone(task.assigned_to)

    def test_cannot_nudge_to_a_non_member(self):
        founder = make_user('outsidernudgefounder@example.com')
        make_user('nonmembertarget@example.com', username='nonmembertarget')
        stack = GroupStack.objects.create(name='Outsider Nudge', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        task = GroupTask.objects.create(stack=stack, text='Nudge fail', created_by=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.post(
            f'/api/groups/{stack.id}/tasks/{task.id}/nudge/', {'username': 'nonmembertarget'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        task.refresh_from_db()
        self.assertIsNone(task.assigned_to)

    def test_nudge_unknown_username_404s(self):
        founder = make_user('unknownnudgefounder@example.com')
        stack = GroupStack.objects.create(name='Unknown Nudge', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        task = GroupTask.objects.create(stack=stack, text='Nudge unknown', created_by=founder)
        self.client.force_authenticate(user=founder)

        response = self.client.post(
            f'/api/groups/{stack.id}/tasks/{task.id}/nudge/', {'username': 'ghostuser'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_member_cannot_nudge(self):
        founder = make_user('nonmembernudgefounder@example.com')
        outsider = make_user('nudgeoutsider@example.com')
        stack = GroupStack.objects.create(name='Non Member Nudge', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)
        task = GroupTask.objects.create(stack=stack, text='Private nudge', created_by=founder)
        self.client.force_authenticate(user=outsider)

        response = self.client.post(
            f'/api/groups/{stack.id}/tasks/{task.id}/nudge/', {'username': 'anyone'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
