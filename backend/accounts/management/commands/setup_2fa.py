import io

import qrcode
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django_otp.plugins.otp_totp.models import TOTPDevice


class Command(BaseCommand):
    """One-time enrollment for admin 2FA. Run once per admin (interactively,
    on the server) to hand them a QR code for Google Authenticator/Authy —
    there's no self-service enrollment page, since accounts/admin.py's
    OTPAdminSite locks out any staff user with no confirmed device, so
    enrollment has to happen out-of-band before their first 2FA login.

    Re-running for the same user replaces their device (old QR/secret stops
    working), which is the intended way to reset a lost authenticator.
    """

    help = 'Create/reset a confirmed TOTP device for an admin user, printing an enrollment QR code.'

    def add_arguments(self, parser):
        parser.add_argument(
            'identifier', help="The user's username or email, e.g. amenbinehsan@gmail.com"
        )

    def handle(self, *args, **options):
        identifier = options['identifier']
        try:
            user = User.objects.get(username=identifier)
        except User.DoesNotExist:
            matches = list(User.objects.filter(email__iexact=identifier))
            if not matches:
                raise CommandError(f'No user found with username/email {identifier!r}')
            if len(matches) > 1:
                # Nothing stops two accounts from sharing an email (login is
                # by username) — narrow to the staff one rather than
                # guessing.
                staff_matches = [u for u in matches if u.is_staff]
                if len(staff_matches) != 1:
                    usernames = ', '.join(u.username for u in matches)
                    raise CommandError(
                        f'{identifier!r} matches multiple users ({usernames}) and not exactly one '
                        'is staff — rerun setup_2fa with the intended account\'s username instead.'
                    )
                user = staff_matches[0]
            else:
                user = matches[0]
        if not user.is_staff:
            raise CommandError(
                f'{user.username} is not staff, so /admin/ would reject them regardless of 2FA — '
                'set is_staff (and is_superuser, if that\'s the intent) first.'
            )

        # Replace any existing device for this user rather than stacking a
        # second one, so re-running this command is how a lost authenticator
        # gets reset.
        TOTPDevice.objects.filter(user=user, name='default').delete()
        device = TOTPDevice.objects.create(user=user, name='default', confirmed=True)

        qr = qrcode.QRCode(border=1)
        qr.add_data(device.config_url)
        qr.make()
        buf = io.StringIO()
        qr.print_ascii(out=buf)

        self.stdout.write(buf.getvalue())
        self.stdout.write(
            self.style.SUCCESS(f'Scan the QR above with an authenticator app for {user.username}.')
        )
        self.stdout.write("Can't scan it? Enter this key manually instead:")
        self.stdout.write(f'  {device.key.upper()}')
        self.stdout.write(
            'Then log in at /admin/ with your username, password, and the 6-digit code together.'
        )
