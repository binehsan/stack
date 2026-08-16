from datetime import datetime, timezone as dt_timezone

from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Profile
from family.models import GroupInvite, GroupMembership, GroupStack

from .models import (
    FREE_DEVICE_LIMIT,
    FREE_GROUP_FOUND_LIMIT,
    GROUP_MEMBER_ABUSE_CAP,
    PRO_VOICE_MONTHLY_LIMIT,
    Device,
    Entitlement,
    VoiceCapture,
)


def make_user(email, password='testpass123'):
    user = User.objects.create_user(username=email, email=email, password=password)
    Profile.objects.create(user=user, username=email.split('@')[0])
    return user


class GroupFoundingLimitTests(APITestCase):
    """A free user can found exactly FREE_GROUP_FOUND_LIMIT (1) group stack
    via a direct API call — the actual attack surface, bypassing any UI."""

    def test_free_user_second_group_is_paywalled(self):
        user = make_user('founder@example.com')
        self.client.force_authenticate(user=user)

        first = self.client.post('/api/groups/create/', {'name': 'Family'})
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post('/api/groups/create/', {'name': 'Friends'})
        self.assertEqual(second.status_code, status.HTTP_402_PAYMENT_REQUIRED)
        self.assertEqual(second.data['code'], 'PAYWALL_GROUP_LIMIT')
        self.assertEqual(
            GroupStack.objects.filter(created_by=user).count(), FREE_GROUP_FOUND_LIMIT
        )

    def test_lifetime_user_can_found_multiple_groups(self):
        user = make_user('lifetime@example.com')
        Entitlement.objects.create(user=user, is_lifetime=True)
        self.client.force_authenticate(user=user)

        for name in ('Family', 'Friends', 'Work'):
            response = self.client.post('/api/groups/create/', {'name': name})
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(GroupStack.objects.filter(created_by=user).count(), 3)


class VoiceCaptureTests(APITestCase):
    def test_free_user_voice_capture_is_paywalled(self):
        user = make_user('free-voice@example.com')
        self.client.force_authenticate(user=user)

        response = self.client.post('/api/billing/voice-capture/')
        self.assertEqual(response.status_code, status.HTTP_402_PAYMENT_REQUIRED)
        self.assertEqual(response.data['code'], 'PAYWALL_VOICE')
        self.assertEqual(VoiceCapture.objects.filter(user=user).count(), 0)

    def test_pro_user_under_quota_succeeds_and_increments(self):
        user = make_user('pro-voice@example.com')
        Entitlement.objects.create(user=user, is_lifetime=True)
        self.client.force_authenticate(user=user)

        response = self.client.post('/api/billing/voice-capture/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(VoiceCapture.objects.filter(user=user).count(), 1)

    def test_pro_user_at_monthly_quota_is_rate_limited(self):
        user = make_user('quota-voice@example.com')
        Entitlement.objects.create(user=user, is_lifetime=True)
        self.client.force_authenticate(user=user)

        VoiceCapture.objects.bulk_create(
            [VoiceCapture(user=user) for _ in range(PRO_VOICE_MONTHLY_LIMIT)]
        )

        response = self.client.post('/api/billing/voice-capture/')
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(response.data['code'], 'VOICE_QUOTA_EXCEEDED')
        self.assertEqual(
            VoiceCapture.objects.filter(user=user).count(), PRO_VOICE_MONTHLY_LIMIT
        )


class DeviceCapTests(APITestCase):
    def test_free_user_second_distinct_device_is_paywalled(self):
        user = make_user('free-device@example.com')

        first = self.client.post(
            '/api/auth/login/',
            {'email': 'free-device@example.com', 'password': 'testpass123', 'device_id': 'phone-a'},
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(Device.objects.filter(user=user).count(), 1)

        second = self.client.post(
            '/api/auth/login/',
            {'email': 'free-device@example.com', 'password': 'testpass123', 'device_id': 'phone-b'},
        )
        self.assertEqual(second.status_code, status.HTTP_402_PAYMENT_REQUIRED)
        self.assertEqual(second.data['code'], 'PAYWALL_DEVICE_LIMIT')
        # The rejected device must not have been created.
        self.assertEqual(Device.objects.filter(user=user).count(), 1)
        self.assertFalse(Device.objects.filter(user=user, device_id='phone-b').exists())

    def test_same_device_id_twice_always_succeeds(self):
        user = make_user('same-device@example.com')

        for _ in range(2):
            response = self.client.post(
                '/api/auth/login/',
                {
                    'email': 'same-device@example.com',
                    'password': 'testpass123',
                    'device_id': 'phone-a',
                },
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(Device.objects.filter(user=user).count(), 1)

    def test_pro_user_unlimited_devices(self):
        user = make_user('pro-device@example.com')
        Entitlement.objects.create(user=user, is_lifetime=True)

        for device_id in ('phone-a', 'phone-b', 'phone-c'):
            response = self.client.post(
                '/api/auth/login/',
                {
                    'email': 'pro-device@example.com',
                    'password': 'testpass123',
                    'device_id': device_id,
                },
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(Device.objects.filter(user=user).count(), 3)

    def test_login_without_device_id_is_unaffected(self):
        make_user('no-device@example.com')
        response = self.client.post(
            '/api/auth/login/',
            {'email': 'no-device@example.com', 'password': 'testpass123'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class GroupMemberCapTests(APITestCase):
    """Applies to every stack regardless of tier — not a paywall."""

    def test_21st_member_via_invite_accept_is_rejected(self):
        founder = make_user('cap-founder@example.com')
        stack = GroupStack.objects.create(name='Big Group', created_by=founder)
        GroupMembership.objects.create(stack=stack, user=founder)

        # Fill the stack up to the cap with other members.
        for i in range(GROUP_MEMBER_ABUSE_CAP - 1):
            filler = make_user(f'filler{i}@example.com')
            GroupMembership.objects.create(stack=stack, user=filler)

        self.assertEqual(GroupMembership.objects.filter(stack=stack).count(), GROUP_MEMBER_ABUSE_CAP)

        latecomer = make_user('latecomer@example.com')
        invite = GroupInvite.objects.create(stack=stack, invited_user=latecomer, invited_by=founder)
        self.client.force_authenticate(user=latecomer)

        response = self.client.post(f'/api/groups/invites/{invite.id}/respond/', {'action': 'accept'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'GROUP_MEMBER_CAP')
        self.assertFalse(GroupMembership.objects.filter(stack=stack, user=latecomer).exists())


@override_settings(REVENUECAT_WEBHOOK_SECRET='test-secret')
class RevenueCatWebhookTests(APITestCase):
    def test_valid_secret_initial_purchase_activates_entitlement(self):
        user = make_user('rc-user@example.com')
        expires_ms = int(datetime(2026, 9, 14, tzinfo=dt_timezone.utc).timestamp() * 1000)

        response = self.client.post(
            '/api/billing/revenuecat-webhook/',
            {
                'event': {
                    'type': 'INITIAL_PURCHASE',
                    'app_user_id': str(user.id),
                    'expiration_at_ms': expires_ms,
                }
            },
            format='json',
            HTTP_AUTHORIZATION='Bearer test-secret',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        entitlement = Entitlement.objects.get(user=user)
        self.assertEqual(entitlement.status, Entitlement.STATUS_ACTIVE)
        self.assertIsNotNone(entitlement.expires_at)
        self.assertEqual(int(entitlement.expires_at.timestamp() * 1000), expires_ms)
        self.assertTrue(entitlement.is_pro)

    def test_missing_secret_is_rejected(self):
        user = make_user('rc-nosecret@example.com')
        response = self.client.post(
            '/api/billing/revenuecat-webhook/',
            {'event': {'type': 'INITIAL_PURCHASE', 'app_user_id': str(user.id)}},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_secret_is_rejected(self):
        user = make_user('rc-wrongsecret@example.com')
        response = self.client.post(
            '/api/billing/revenuecat-webhook/',
            {'event': {'type': 'INITIAL_PURCHASE', 'app_user_id': str(user.id)}},
            format='json',
            HTTP_AUTHORIZATION='Bearer nope',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unknown_event_type_is_a_no_op(self):
        user = make_user('rc-unknown@example.com')
        response = self.client.post(
            '/api/billing/revenuecat-webhook/',
            {'event': {'type': 'SOME_FUTURE_EVENT', 'app_user_id': str(user.id)}},
            format='json',
            HTTP_AUTHORIZATION='Bearer test-secret',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # An Entitlement row may get created (lazily, via get_or_create) as
        # part of the user lookup, but an unrecognized event type must not
        # change its status/expiry — no-op means no-op.
        entitlement = Entitlement.objects.filter(user=user).first()
        if entitlement is not None:
            self.assertEqual(entitlement.status, Entitlement.STATUS_FREE)
            self.assertFalse(entitlement.is_pro)
