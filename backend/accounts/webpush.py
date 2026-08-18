import json

from django.conf import settings
from pywebpush import WebPushException, webpush


def send_web_push(subscriptions, title, body, data=None):
    """Fire-and-forget a Web Push notification to one or more
    WebPushSubscription rows — the PWA's counterpart to family/push.py's
    send_expo_push. Runs synchronously in the request, same tradeoff as the
    Expo version (there's no task queue in this project): a slow/failing
    push delays the response but never raises, so a nudge/invite still
    succeeds even if the push itself doesn't.

    Each subscription is sent independently (not batched, unlike Expo's
    API) since Web Push has no multi-recipient endpoint — a dead endpoint
    for one browser shouldn't block delivery to the others.
    """
    if not settings.VAPID_PRIVATE_KEY:
        # Not configured — same reject-quietly stance as an unset Expo
        # token list, not an error (see README for how to generate keys).
        return

    payload = json.dumps({'title': title, 'body': body, 'data': data or {}})

    for subscription in subscriptions:
        try:
            webpush(
                subscription_info={
                    'endpoint': subscription.endpoint,
                    'keys': {'p256dh': subscription.p256dh, 'auth': subscription.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={'sub': f'mailto:{settings.VAPID_CLAIMS_EMAIL}'},
            )
        except WebPushException as err:
            status_code = getattr(err.response, 'status_code', None)
            if status_code in (404, 410):
                # Gone/Not Found — the browser unsubscribed or the endpoint
                # expired, and it will never succeed again. Clean it up now
                # rather than retrying it on every future push.
                subscription.delete()
            else:
                print(f'## Web push send failed for {subscription.endpoint[:60]}...: {err}')
