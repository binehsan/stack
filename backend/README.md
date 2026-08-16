# Stack — Backend

Django + Django REST Framework API for the Stack app. `tasks` app for the
personal daily-reset task API, `accounts` app for JWT auth + profile, `family`
app for shared group stacks (the app directory/label stayed `family` — only
the models and URL prefix were renamed, an app-label rename isn't worth the
migration risk). SQLite database. Tasks are scoped per-user.

## Setup

From the `backend/` directory:

```bash
# 1. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 2. Install dependencies (includes djangorestframework-simplejwt + Pillow)
pip install -r requirements.txt

# 3. Apply migrations (creates db.sqlite3)
python manage.py migrate

# 4. Run the dev server, bound to all interfaces so your phone can reach it
python manage.py runserver 0.0.0.0:8000
```

The API is now available at `http://<your-computer's-LAN-IP>:8000/api/`.

**Important:** run with `0.0.0.0:8000`, not the default `127.0.0.1:8000` —
otherwise the server only accepts connections from the same machine, and your
phone running Expo Go won't be able to reach it. Find your computer's LAN IP with
`ipconfig` (Windows, look for "IPv4 Address") or `ifconfig` / `ip addr` (macOS/Linux),
then set that IP in `frontend/src/api/config.js`.

## API

### Auth (`accounts` app, email + password, JWT)

| Method | Endpoint              | Purpose                                                    |
|--------|------------------------|-------------------------------------------------------------|
| POST   | `/api/auth/register/`  | Create an account — `{"email", "password", "password_confirm", "username"}` (`username` optional — auto-generated from the email if blank), returns `{access, refresh, email, username}` |
| POST   | `/api/auth/login/`     | `{"email", "password"}` → `{access, refresh, email, username}` |
| POST   | `/api/auth/refresh/`   | `{"refresh"}` → new `{access, refresh}` (refresh rotates)   |
| POST   | `/api/auth/change-password/` | `{"old_password", "new_password", "new_password_confirm"}`, auth required |
| DELETE | `/api/auth/delete-account/`  | `{"password"}` — permanently deletes the account and cascades to their tasks |
| GET/PATCH | `/api/auth/profile/`  | `{username, avatar, reset_hour, email}`. PATCH accepts JSON (`username`, `reset_hour`) or `multipart/form-data` (`avatar` file). `avatar` is returned as an absolute URL or `null`. |
| POST   | `/api/auth/push-token/` | `{"token"}` — registers (or re-owns) an Expo push token for the caller's device. Upsert on `token`, so re-registering the same value is a no-op, not an error — one user can have several (one per device). |

Push notifications piggyback on this: `family/views.py`'s `nudge` action sends an Expo push to the target's registered tokens after reassigning a task (`family/push.py:send_expo_push`, a plain `urllib` POST to Expo's push API — no task queue, so this runs synchronously and swallows its own errors rather than failing the nudge). None of this does anything until the frontend has EAS set up — see `frontend/README.md`'s push notifications section for the checklist.

All `/api/tasks/...` and `/api/groups/...` endpoints below require
`Authorization: Bearer <access>`.

### Tasks (personal, daily-reset)

| Method | Endpoint            | Purpose                              |
|--------|----------------------|---------------------------------------|
| GET    | `/api/tasks/`         | List today's tasks                    |
| POST   | `/api/tasks/`         | Create a task (`{"text": "..."}`)     |
| PATCH  | `/api/tasks/<id>/`    | Update a task (`{"completed": true}` or `{"starred": true}`) |
| DELETE | `/api/tasks/<id>/`    | Delete a task                         |
| POST   | `/api/tasks/reorder/`   | `{"task_ids": [...]}` — persists a new drag-and-drop priority order for today's tasks (full ordered list each time) |

Tasks are scoped to "today" server-side — not calendar midnight, but the
user's own `Profile.reset_hour` (set via `/api/auth/profile/`, default `0` =
midnight; see `get_today_range()` in `tasks/views.py`). Tasks from previous
"days" (by that boundary) simply don't appear in any of the endpoints above,
which gives the app its daily-reset behavior for free without a scheduled job.

### Feature endpoints (focus mode, carry-forward, recap, quick-add, stats)

| Method | Endpoint                              | Purpose |
|--------|-----------------------------------------|---------|
| GET    | `/api/tasks/recap/`                     | Yesterday's `{date, total, completed}`, or `204 No Content` if there's nothing to recap. Meant to be shown once per day client-side. |
| GET    | `/api/tasks/carry-forward-candidates/`  | Yesterday's unfinished, not-yet-resolved tasks — the opt-in carry-forward prompt's data source. |
| POST   | `/api/tasks/carry-forward/`             | `{"task_ids": [...]}` — creates fresh today-tasks for the given ids and marks *all* of yesterday's candidates as resolved (so the prompt never asks about the same task twice), regardless of which ids were picked. |
| GET    | `/api/tasks/suggestions/`               | Up to 5 of the user's task texts repeated ≥2 times in the last 14 days, most-repeated first — the quick-add chip data source. |
| GET    | `/api/tasks/stats/`                      | All-time profile stats: `current_streak`, `longest_streak`, `total_created`, `total_completed`, `days_active`, `best_day` ({date, completed} or `null`), `member_since`. Computed from real history (day-grouped in Python so it respects `reset_hour`) — task rows are never deleted by the daily reset, only filtered out of the "today" queryset. |

Starring a task (`PATCH {"starred": true}`) is capped at 3 per day per user;
a 4th attempt returns `400`.

**Note on timezone:** `TIME_ZONE` in `config/settings.py` defaults to `UTC`
and is the base for every user's reset-hour boundary. Change it to your own
timezone (e.g. `'America/New_York'`) so a `reset_hour` of, say, `4` actually
means 4am in your timezone.

### Group stacks (`family` app — shared, not day-scoped)

A user can belong to any number of group stacks at once (e.g. one for
family, one for friends) — there's no fixed "type", just a name, an
optional photo, and members. Group tasks persist until completed/deleted —
no daily reset. Every endpoint below except `mine/`, `create/`, `invites/`,
and `invites/<id>/respond/` is scoped under a specific `<stack_id>` and
requires the caller to be a member of that stack.

| Method | Endpoint                                        | Purpose |
|--------|--------------------------------------------------|---------|
| GET    | `/api/groups/mine/`                               | Every group stack the caller belongs to (`[{id, name, image, created_at, members}]`). |
| POST   | `/api/groups/create/`                             | `{"name"}` — creates a stack and makes the caller its first member. |
| GET    | `/api/groups/<stack_id>/`                         | A single stack's details. |
| PATCH  | `/api/groups/<stack_id>/`                         | `{"name"}` (JSON) or `{"name", "image"}` (`multipart/form-data`) — update the stack's name/photo. `image` is returned as an absolute URL or `null`. |
| POST   | `/api/groups/<stack_id>/leave/`                   | Leaves that stack (deletes it too if that was the last member). |
| GET    | `/api/groups/invites/`                            | Pending invites addressed to the caller, across all stacks. |
| POST   | `/api/groups/<stack_id>/invite/`                  | `{"username"}` (no `@` needed) — invite a user to this stack. |
| POST   | `/api/groups/invites/<id>/respond/`               | `{"action": "accept"}` or `{"action": "decline"}`. |
| GET/POST | `/api/groups/<stack_id>/tasks/`                 | List/create shared tasks on this stack. |
| PATCH/DELETE | `/api/groups/<stack_id>/tasks/<task_id>/`   | Update (`completed`/`text`) or delete a shared task. |
| POST   | `/api/groups/<stack_id>/tasks/<task_id>/nudge/`   | `{"username"}` — delegate the task to that member (must be a stack member), or omit `username`/send `""` to clear the assignment. |

Each member in `members`/`created_by`/`assigned_to` is `{id, email, username, avatar}`.

### Billing / Stack Pro (`billing` app)

Server-authoritative subscription entitlement, backed by RevenueCat webhooks
— the frontend never gets to declare itself "Pro" on its own; every gated
endpoint (below and in `accounts`/`family`) checks `Entitlement.is_pro`
computed here. `GET /api/billing/entitlement/` requires
`Authorization: Bearer <access>` like every other authenticated endpoint;
the webhook is the one exception (see its row).

| Method | Endpoint                              | Purpose |
|--------|-----------------------------------------|---------|
| GET    | `/api/billing/entitlement/`             | The caller's current Pro status + usage counters (see shape below), auth required. Meant to be polled/refreshed by the frontend after any purchase, restore, or app foreground. |
| POST   | `/api/billing/revenuecat-webhook/`      | RevenueCat subscription lifecycle events. **Not JWT-authenticated** — validated instead via a shared secret in `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`. Always 200 once authenticated and parseable (including no-op/unknown event types), so RevenueCat doesn't retry-storm us; 401 on a missing/wrong secret, 400 if the body doesn't parse. |
| POST   | `/api/billing/voice-capture/`           | Reserves one voice-input use against the caller's monthly Pro quota. Auth required. `402 {"code": "PAYWALL_VOICE"}` if the caller isn't Pro; `429 {"code": "VOICE_QUOTA_EXCEEDED", "reset_at": ...}` if they've used all `PRO_VOICE_MONTHLY_LIMIT` (200) captures this calendar month; otherwise creates a `VoiceCapture` row and returns `204`. **This is a quota-reservation stub only** — there's no actual speech-to-text behind it anywhere in this codebase; it exists so the frontend can wire a real mic feature to it later without a backend change. |

`GET /api/billing/entitlement/` response shape:

```json
{
  "is_pro": true,
  "status": "active",
  "expires_at": "2026-09-14T00:00:00Z",
  "is_lifetime": false,
  "groups_founded": 1,
  "groups_founded_limit": null,
  "devices": 1,
  "devices_limit": null,
  "voice_captures_used": 12,
  "voice_captures_limit": 200,
  "voice_reset_at": "2026-09-01T00:00:00Z"
}
```

`*_limit` fields are `null` when the caller is Pro (unlimited), else the
free-tier constant (`FREE_GROUP_FOUND_LIMIT = 1`, `FREE_DEVICE_LIMIT = 1`,
`PRO_VOICE_MONTHLY_LIMIT = 200` — all in `billing/models.py`).
`voice_reset_at` is always the first of next month in `TIME_ZONE`; voice
quota is counted from `VoiceCapture` rows created in the current calendar
month rather than a separate counter, so there's no reset-race to get wrong.

**The `Entitlement` model** (`billing/models.py`) is the single
source of truth for a user's Pro status — `status` (`free`/`active`/
`trialing`/`cancelled`/`expired`), `expires_at`, and `is_lifetime` (the
one-time non-consumable "lifetime unlock", always Pro regardless of
`status`/`expires_at`). It's created lazily via `get_or_create_entitlement()`
on first read or write, not backfilled by migration. Only the RevenueCat
webhook (or an admin editing it by hand, e.g. to grant a lifetime unlock
manually) ever changes it — nothing else in the codebase should write to it.

**`REVENUECAT_WEBHOOK_SECRET`** (env var, read in `config/settings.py`)
must be set before the webhook will accept anything — an unset/empty value
makes it reject-closed (401 on every request) rather than silently trusting
unauthenticated callers. Get the value from the RevenueCat dashboard
(Project settings → Webhooks → set an "Authorization header value" there,
then use that same string here) and configure the webhook URL there as
`https://<your-host>/api/billing/revenuecat-webhook/`.

**Two other endpoints gate on entitlement without living in `billing`'s own
URLs**, since they're extending existing flows: `POST /api/groups/create/`
(`family` app) 402s with `{"code": "PAYWALL_GROUP_LIMIT"}` on a free user's
2nd group; `POST /api/auth/login/` and `POST /api/auth/register/`
(`accounts` app) both accept an optional `device_id` field and 402 with
`{"code": "PAYWALL_DEVICE_LIMIT"}` if a free user's device isn't already
known and they're at `FREE_DEVICE_LIMIT`. Both fail the request outright
(no tokens issued, no `Device` row created) rather than succeeding and
capping later. `device_id` is optional and backward compatible — omitting
it (older/unmodified clients) skips all device logic.

**The 20-member group cap** (`GROUP_MEMBER_ABUSE_CAP` in
`billing/models.py`, enforced in `family/views.py`'s
`RespondGroupInviteView`) is **not** a paywall — it applies to every group
regardless of the founder's or joiner's tier, and returns
`400 {"code": "GROUP_MEMBER_CAP"}` with plain "this group is full" wording,
purely to stop the free "found 1 group" tier being abused as an unlimited
public broadcast list.

## Admin

A superuser lets you inspect tasks and users directly at `/admin/`:

```bash
python manage.py createsuperuser
```

## Notes for later

- Auth: Django's built-in `User` model, `email` doubles as `username` (no
  separate custom user model). `djangorestframework-simplejwt` issues short-lived
  access tokens (30 min) + rotating refresh tokens (30 days) — see `SIMPLE_JWT`
  in `config/settings.py`.
- CORS is wide open (`CORS_ALLOW_ALL_ORIGINS = True`) and `ALLOWED_HOSTS = ['*']`,
  which is fine for local development but should be tightened before any
  real deployment.
- Avatars are stored on local disk (`MEDIA_ROOT`) and served directly by
  Django only because `DEBUG = True` (see `config/urls.py`) — needs real
  object storage (e.g. S3) before any real deployment.
- `Profile` (username/avatar/reset_hour) is a separate model with a
  `OneToOneField` to `User`, created at registration — not a custom user
  model, since it's purely additive to auth, not a change to it.
