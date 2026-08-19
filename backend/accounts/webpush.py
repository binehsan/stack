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
                # rather than retrying it on every future push. This is the
                # common case for subscriptions registered during local dev
                # against a `cloudflared tunnel --url` quick tunnel: every
                # tunnel restart mints a fresh *.trycloudflare.com URL, so a
                # subscription tied to a since-ended tunnel session is dead
                # for good — same as any real subscription that expires or
                # gets revoked in production.
                subscription.delete()
            else:
                print(f'## Web push send failed for {subscription.endpoint[:60]}...: {err}')
        except Exception as err:  # noqa: BLE001 — deliberately broad, see below
            # webpush() only raises WebPushException once it has a response
            # from the push service (see pywebpush's WebPusher.send, which
            # calls requests.post with no try/except of its own). A network-
            # level failure — DNS not resolving, connection refused, TLS
            # error, timeout — raises a requests exception instead, which is
            # exactly what happens when the push service side of things is
            # unreachable (e.g. mid-tunnel-restart during dev testing, or
            # any transient outage in production). That's not proof the
            # subscription is dead, so it's logged and skipped rather than
            # deleted — but it must never propagate, or one bad/unreachable
            # subscription would crash the whole send_web_push call and,
            # with it, the invite/nudge endpoint that triggered it.
            print(f'## Web push send errored for {subscription.endpoint[:60]}...: {err}')
