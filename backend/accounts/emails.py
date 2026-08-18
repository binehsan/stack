import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_branded_email(to_email, subject, template_name, context=None):
    """Renders `template_name` (which should extend emails/base_email.html
    for the shared header/footer chrome — see password_reset.html for the
    pattern) and sends it as HTML with an auto-generated plain-text
    fallback. Any future transactional email (welcome, group invite, etc.)
    should go through this rather than reinventing the wrapper.

    Swallows send failures rather than raising: a misconfigured/down SMTP
    server shouldn't 500 the API call that triggered the email (e.g.
    password reset still needs to return its generic "check your email"
    response either way) — but it does get logged so a real outage is
    visible in the logs rather than silently invisible.
    """
    context = {**(context or {}), 'frontend_url': settings.FRONTEND_URL}
    html_body = render_to_string(template_name, context)
    text_body = strip_tags(html_body)

    message = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [to_email])
    message.attach_alternative(html_body, 'text/html')
    try:
        message.send()
    except Exception:
        logger.exception('Failed to send email (subject=%r) to %s', subject, to_email)
