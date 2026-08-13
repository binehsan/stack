import json
import urllib.request

# Expo's push API accepts a single POST for any number of messages — no SDK
# needed for this, and `requests` isn't otherwise a dependency of this
# project, so stdlib urllib keeps this to one small, self-contained module.
EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'


def send_expo_push(tokens, title, body, data=None):
    """Fire-and-forget a push notification to one or more Expo push tokens.
    Runs synchronously in the request (there's no task queue in this
    project) — a slow/failing Expo API call delays the response but never
    raises, so a nudge still succeeds even if the push itself doesn't."""
    tokens = [t for t in tokens if t]
    if not tokens:
        return

    messages = [
        {'to': token, 'title': title, 'body': body, 'data': data or {}} for token in tokens
    ]
    payload = json.dumps(messages).encode('utf-8')
    request = urllib.request.Request(
        EXPO_PUSH_URL,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            response.read()
    except Exception as err:  # noqa: BLE001 — deliberately broad, see docstring
        print(f'## Expo push send failed: {err}')
