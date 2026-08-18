from io import BytesIO

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Profile, PushToken


def make_user(email, password='testpass123', username=None):
    user = User.objects.create_user(username=email, email=email, password=password)
    Profile.objects.create(user=user, username=username or email.split('@')[0])
    return user


def make_test_image(name='avatar.png'):
    """A minimal but real PNG — Django's ImageField validates actual image
    content (via Pillow), so arbitrary bytes would fail validation."""
    buf = BytesIO()
    Image.new('RGB', (8, 8), color='red').save(buf, format='PNG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/png')


class RegisterTests(APITestCase):
    # accounts/views.py's throttle_scope = 'auth' rate-limits this endpoint
    # per-IP — DRF's throttle "request history" lives in Django's cache, not
    # the database, so it isn't reset by APITestCase's usual per-test
    # transaction rollback. Every call in this class shares the test
    # client's one IP, so without clearing the cache between tests, this
    # class's own request volume would eventually trip the same 10/min
    # limit real abuse is supposed to hit — not a bug in the throttle,
    # just the test suite needing its own clean slate each time.
    def setUp(self):
        cache.clear()

    def test_register_with_default_username(self):
        response = self.client.post(
            '/api/auth/register/',
            {'email': 'new@example.com', 'password': 'testpass123', 'password_confirm': 'testpass123'},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'new@example.com')
        self.assertEqual(response.data['username'], 'new')
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(username='new@example.com').exists())

    def test_register_with_chosen_username(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'chooser@example.com',
                'password': 'testpass123',
                'password_confirm': 'testpass123',
                'username': 'CoolHandle',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Usernames are normalized to lowercase.
        self.assertEqual(response.data['username'], 'coolhandle')

    def test_duplicate_username_falls_back_to_suffixed_default(self):
        make_user('first@example.com', username='dup')
        response = self.client.post(
            '/api/auth/register/',
            {'email': 'dup@example.com', 'password': 'testpass123', 'password_confirm': 'testpass123'},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'dup1')

    def test_duplicate_email_is_rejected(self):
        make_user('taken@example.com')
        response = self.client.post(
            '/api/auth/register/',
            {'email': 'taken@example.com', 'password': 'testpass123', 'password_confirm': 'testpass123'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_chosen_username_is_rejected(self):
        make_user('owner@example.com', username='mine')
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'other@example.com',
                'password': 'testpass123',
                'password_confirm': 'testpass123',
                'username': 'mine',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mismatched_passwords_are_rejected(self):
        response = self.client.post(
            '/api/auth/register/',
            {'email': 'mismatch@example.com', 'password': 'testpass123', 'password_confirm': 'different123'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username='mismatch@example.com').exists())

    def test_short_password_is_rejected(self):
        response = self.client.post(
            '/api/auth/register/',
            {'email': 'short@example.com', 'password': 'short', 'password_confirm': 'short'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_username_characters_are_rejected(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'badname@example.com',
                'password': 'testpass123',
                'password_confirm': 'testpass123',
                'username': 'not a valid handle!',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    # See RegisterTests.setUp's comment — same reasoning, same fix.
    def setUp(self):
        cache.clear()

    def test_correct_credentials_succeed(self):
        make_user('login@example.com')
        response = self.client.post(
            '/api/auth/login/', {'email': 'login@example.com', 'password': 'testpass123'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_email_login_is_case_insensitive(self):
        make_user('caseuser@example.com')
        response = self.client.post(
            '/api/auth/login/', {'email': 'CaseUser@Example.com', 'password': 'testpass123'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_wrong_password_is_rejected(self):
        make_user('wrongpass@example.com')
        response = self.client.post(
            '/api/auth/login/', {'email': 'wrongpass@example.com', 'password': 'nope'}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unknown_email_is_rejected(self):
        response = self.client.post(
            '/api/auth/login/', {'email': 'ghost@example.com', 'password': 'testpass123'}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_repeated_attempts_are_rate_limited(self):
        # Matches REST_FRAMEWORK's DEFAULT_THROTTLE_RATES['auth'] = '10/min'
        # (settings.py) — the 11th request from the same IP inside a minute
        # should be rejected before it even reaches LoginView's own logic,
        # regardless of whether the credentials on that 11th attempt were
        # correct. This is the actual behavior Day 3's "no rate limiting on
        # auth endpoints" gap was about.
        for _ in range(10):
            self.client.post('/api/auth/login/', {'email': 'ghost@example.com', 'password': 'x'})
        response = self.client.post('/api/auth/login/', {'email': 'ghost@example.com', 'password': 'x'})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class ChangePasswordTests(APITestCase):
    def test_requires_authentication(self):
        response = self.client.post(
            '/api/auth/change-password/',
            {'old_password': 'a', 'new_password': 'newpass123', 'new_password_confirm': 'newpass123'},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_change(self):
        user = make_user('changepw@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'testpass123',
                'new_password': 'newpass456',
                'new_password_confirm': 'newpass456',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        user.refresh_from_db()
        self.assertTrue(user.check_password('newpass456'))

    def test_wrong_old_password_is_rejected(self):
        user = make_user('wrongold@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'notmypassword',
                'new_password': 'newpass456',
                'new_password_confirm': 'newpass456',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        user.refresh_from_db()
        self.assertTrue(user.check_password('testpass123'))

    def test_mismatched_new_passwords_are_rejected(self):
        user = make_user('mismatchpw@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'testpass123',
                'new_password': 'newpass456',
                'new_password_confirm': 'somethingelse',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DeleteAccountTests(APITestCase):
    def test_requires_authentication(self):
        response = self.client.delete('/api/auth/delete-account/', {'password': 'x'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_password_is_rejected(self):
        user = make_user('keepme@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.delete('/api/auth/delete-account/', {'password': 'nope'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(pk=user.pk).exists())

    def test_correct_password_deletes_account(self):
        user = make_user('deleteme@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.delete(
            '/api/auth/delete-account/', {'password': 'testpass123'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=user.pk).exists())


class ProfileTests(APITestCase):
    def test_get_profile(self):
        user = make_user('getprofile@example.com', username='getter')
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'getter')
        self.assertEqual(response.data['email'], 'getprofile@example.com')
        self.assertIsNone(response.data['avatar'])

    def test_patch_username(self):
        user = make_user('renamer@example.com', username='oldname')
        self.client.force_authenticate(user=user)
        response = self.client.patch('/api/auth/profile/', {'username': 'NewName'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'newname')

    def test_patch_username_taken_is_rejected(self):
        make_user('holder@example.com', username='held')
        user = make_user('wanter@example.com', username='wanter')
        self.client.force_authenticate(user=user)
        response = self.client.patch('/api/auth/profile/', {'username': 'held'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_own_unchanged_username_succeeds(self):
        # Re-submitting your own current username shouldn't trip the
        # uniqueness check against yourself.
        user = make_user('same@example.com', username='same')
        self.client.force_authenticate(user=user)
        response = self.client.patch('/api/auth/profile/', {'username': 'same'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_reset_hour_out_of_range_is_rejected(self):
        user = make_user('resethour@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.patch('/api/auth/profile/', {'reset_hour': 24}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_reset_hour_valid(self):
        user = make_user('validhour@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.patch('/api/auth/profile/', {'reset_hour': 4}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reset_hour'], 4)

    def test_patch_avatar_upload(self):
        user = make_user('avataruser@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.patch(
            '/api/auth/profile/', {'avatar': make_test_image()}, format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['avatar'])


class PushTokenTests(APITestCase):
    def test_register_creates_token(self):
        user = make_user('pushuser@example.com')
        self.client.force_authenticate(user=user)
        response = self.client.post('/api/auth/push-token/', {'token': 'ExponentPushToken[abc]'})
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(PushToken.objects.filter(user=user, token='ExponentPushToken[abc]').exists())

    def test_re_registering_same_token_is_a_no_op_not_an_error(self):
        user = make_user('reregister@example.com')
        self.client.force_authenticate(user=user)
        for _ in range(2):
            response = self.client.post('/api/auth/push-token/', {'token': 'ExponentPushToken[dup]'})
            self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(PushToken.objects.filter(token='ExponentPushToken[dup]').count(), 1)

    def test_registering_same_token_on_new_account_reassigns_it(self):
        # Same physical device, different logged-in account — the token
        # should move to whoever registers it most recently.
        first_user = make_user('device-owner-a@example.com')
        second_user = make_user('device-owner-b@example.com')

        self.client.force_authenticate(user=first_user)
        self.client.post('/api/auth/push-token/', {'token': 'ExponentPushToken[shared]'})

        self.client.force_authenticate(user=second_user)
        self.client.post('/api/auth/push-token/', {'token': 'ExponentPushToken[shared]'})

        token = PushToken.objects.get(token='ExponentPushToken[shared]')
        self.assertEqual(token.user, second_user)
        self.assertEqual(PushToken.objects.filter(token='ExponentPushToken[shared]').count(), 1)
