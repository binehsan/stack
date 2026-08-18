# Stack — Full Build-to-Launch Guide

One linear path, in order. Each stage ends with a **"Test before moving on"**
checklist — don't skip ahead until that stage's tests pass, since later
stages assume earlier ones actually work. Dashboard menu paths below are
accurate as of when this was written; third-party dashboards do reshuffle
occasionally, so if a label doesn't match exactly, look for the nearest
equivalent (e.g. "Settings" vs "Project Settings").

**Decision (2026-08-18): Stack is entirely free — no paid tier, no ads, no
IAP, on the app, the website, or ever (unless the app grows into a real
business later, at which point it'd get its own LLC + fresh developer
accounts rather than retrofitting these). Both the RevenueCat mobile IAP
flow and the website's Stripe subscription have been fully removed from the
codebase, not just disabled. Published as an **Individual** account on both
the App Store and Google Play — free = non-trader = no forced public address
disclosure under Apple's EU DSA rule or Google's merchant-account trigger.**

## Where things stand right now

- **Backend**: Django + DRF, SQLite, running locally on your LAN only
  (`0.0.0.0:8000`) — not reachable from the internet yet. Full test suite
  across the three apps (`accounts`, `tasks`, `family`) — run
  `python manage.py test` from `backend/` to confirm it's green.
- **Frontend**: Expo/React Native, off Expo Go and onto a real EAS
  dev-client build (Stage 1 done). Push notifications wired and tested
  two-device (Stage 2 done). Four free theme families (Classic/Purple/
  Forest Green/Alpine Blue), voice input via on-device speech-to-text, no
  gating on any of it.
- **App icon**: done. **Notification icon**: fixed in code, needs the next
  `eas build` to actually take effect (native asset — JS reload isn't enough).
- **Not yet done**: Google Play Console account, Apple Developer Program
  enrollment, backend deployed anywhere reachable from the internet, any
  store listing, any legal pages.

---

## Stage 0 — Confirm today's baseline still works

Before touching any dashboard, make sure the app runs as-is. If this stage
fails, fix it first — nothing below will help you diagnose a problem that
already existed.

1. **Backend**: from `backend/`, run `python manage.py runserver 0.0.0.0:8000`
2. **Frontend**: from `frontend/`, confirm `src/api/config.js`'s `HOST` is
   your computer's current LAN IP (`ipconfig` → "IPv4 Address"; it changes
   if you've switched networks since last time), then `npx expo start`
3. Scan the QR code with **Expo Go** on your phone (same Wi-Fi network)

### Test before moving on
- [ ] Register a new account, log out, log back in
- [ ] Add a task, star it (appears in Focus), complete it (moves to Dump), delete one
- [ ] Create a group stack, and from `MyStackScreen` confirm your avatar/username save
- [ ] Voice input shows a graceful "coming soon"-style fallback (not an error) if the native module isn't built in yet

---

## Stage 1 — EAS account + first dev-client build

Push notifications and voice input are both **native modules** — neither
works in Expo Go, no matter what. This stage gets you off Expo Go and onto
a real installable build, with nothing else changed yet, so you can isolate
"did the rebuild break something" from "did the new feature break
something" in later stages.

1. Go to **expo.dev** → sign up / log in (free)
2. From `frontend/`, this repo is already linked to a project (`app.json`'s
   `extra.eas.projectId` is already set) — if `eas whoami` doesn't show you
   as logged in, run `eas login` first
3. Run: `npx eas-cli build --profile development --platform android`
4. Wait for the cloud build to finish (EAS emails/prints a link when done)
5. Scan the QR code EAS gives you, or download the `.apk` link directly to
   your Android phone, and install it (you'll need to allow "install from
   unknown sources" the first time)

### Test before moving on
- [ ] Open the installed dev-client app (not Expo Go), run `npx expo start --dev-client`, and confirm it connects
- [ ] Repeat every Stage 0 test inside this build — login, tasks, group stacks — nothing should behave differently than Expo Go did

---

## Stage 2 — Firebase + Android push notifications

1. Go to **console.firebase.google.com** → **Add project** → name it
   anything (e.g. "Stack") → follow the prompts (Analytics is optional,
   skip it) → **Create project**
2. From `frontend/`, run: `eas credentials`
3. Select **Android** → select **Push Notifications (FCM)** → choose the
   option to let EAS generate/upload the service account key for you (it
   walks you through linking the Firebase project you just made)
4. Rebuild if EAS tells you to (it usually doesn't need a full rebuild for
   credentials-only changes, but follow its own prompt)

### Test before moving on
You need **two accounts on two physical devices** (or one device + someone
helping) — a push can't be observed on the same device that triggers it.

- [ ] Install the dev-client build (Stage 1) on both devices, run `npx expo start --dev-client`, connect both
- [ ] Log into a different account on each device
- [ ] Device A: create a group stack, invite Device B's username
- [ ] Accept the OS notification-permission prompt on Device B the first time it touches a group stack (if you dismiss it, the app won't ask again — reset notification permissions for the app in system settings to retry)
- [ ] Device B receives a push for the invite within a few seconds; accept it
- [ ] Device A: add a task to the shared stack, tap "Nudge" on it, assign to Device B
- [ ] Device B receives a second push for the nudge
- [ ] If nothing arrives: check the backend console for `## Expo push send failed: ...` — that tells you "never sent" vs "sent but not delivered"

---

## Stage 2.5 — Regression pass

Worth confirming the app actually works on-device before spending anything
on store accounts — all doable right now with zero new accounts.

1. Backend: from `backend/`, run `python manage.py test` → expect all green
2. **Theme picker**: `MyStackScreen` → Theme section → tap through all 4
   swatches (Classic/Purple/Forest Green/Alpine Blue), and toggle
   light/dark (the sun/moon button) on each — 8 combinations total. Check
   every screen's text stays readable, and the Logo's white ring is still
   visible against the gradient in each
3. **Voice input**: tap the mic, speak a short task → confirms it
   live-transcribes AND auto-adds itself once you stop talking, with no
   need to tap +. Tap mic and stay silent → confirms nothing gets wrongly
   auto-submitted
4. **Group-invite popup**: from Device A, invite Device B to a group
   stack → on Device B, tap the push notification (not just open the app) →
   confirms an Accept/Decline popup appears immediately, and Accept lands
   you inside that stack
5. **Nudge navigation**: Device A nudges a task onto Device B → tap that
   push notification on Device B → confirms it opens straight into the
   correct group stack
6. **Leave-stack refresh**: from inside a group stack, tap "Leave this
   stack" → confirms the hub list updates immediately, no back-and-reopen needed
7. Confirm a 21st member invite to one group stack is rejected with the
   "group is full" message (`GROUP_MEMBER_CAP`) — the only cap left
   anywhere, unrelated to accounts/payment (see backend README)

---

## Stage 3 — Google Play Console (Android)

1. **play.google.com/console** → pay the **$25 one-time registration fee**
   → complete account setup **as an Individual account** (not Organization
   — see the address-disclosure reasoning at the top of this doc)
2. **Create app** → name "Stack" → fill in the required defaults (app or
   game: App; free or paid: **Free**; declarations) → Create
3. **Release → Testing → Internal testing** → create a release, add
   yourself + a few testers → this is where you'll do real-device QA before
   any public release

### Test before moving on
- [ ] Install the app via the internal testing link on a real device (not just the dev-client build)
- [ ] Full regression pass: register, login, tasks, group stacks, push, theme picker, voice input — nothing behind a lock or upsell anywhere

---

## Stage 4 — Deploy the backend for real

Real users' phones need to reach your backend over the public internet —
your LAN IP doesn't work once you're off your own Wi-Fi. **Decision made**:
self-host on your existing VPS (6 vCores/8GB/240GB NVMe, currently running a
college library app) rather than a PaaS — massively more headroom than this
workload needs, and $0 marginal cost. Commands below assume Ubuntu/Debian
(`apt`); adjust for your actual distro.

### 4a. Reality-check current headroom before adding anything

1. SSH in, then: `htop` (or `top`) — check the college app's baseline
   CPU/RAM under normal load, `free -h` — confirm actual free RAM, `df -h`
   — confirm free disk. This is a sanity check, not expected to find a
   problem — just don't skip it.

### 4b. Isolate Stack from the existing app

2. Create a dedicated Linux user so Stack's process never runs as the same
   user as the college app: `sudo adduser stackapp` (system default
   options are fine)
3. `sudo mkdir -p /srv/stack && sudo chown stackapp:stackapp /srv/stack`

### 4c. Postgres — move off SQLite

4. Check if Postgres is already installed (the college app may already use
   it): `psql --version`. If not: `sudo apt install postgresql`
5. `sudo -u postgres psql` then, at the `postgres=#` prompt:
   ```sql
   CREATE DATABASE stack_db;
   CREATE USER stack_user WITH PASSWORD 'pick-a-real-password-here';
   ALTER ROLE stack_user SET client_encoding TO 'utf8';
   GRANT ALL PRIVILEGES ON DATABASE stack_db TO stack_user;
   \q
   ```

### 4d. Code changes needed here — tell me when you reach this step

6. This is real code, not a dashboard click — flag it here and I'll make
   these edits:
   - `DATABASES` reads from an env var (`DATABASE_URL` via `dj-database-url`
     or explicit `POSTGRES_*` env vars) instead of the hardcoded SQLite path
   - `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOW_ALL_ORIGINS` all
     read from env vars, tightened for production (`ALLOWED_HOSTS` to your
     real domain, `DEBUG=False`, `CORS_ALLOW_ALL_ORIGINS=False` with an
     explicit allowlist — though CORS matters less here since the mobile
     app doesn't send browser-style Origin headers the way a website would)
   - `requirements.txt` gets `psycopg2-binary`, `gunicorn`, and
     `python-dotenv` (or equivalent) added
7. Generate a real `SECRET_KEY` now, save it somewhere safe:
   `python -c "import secrets; print(secrets.token_urlsafe(50))"`

### 4e. Deploy the code

8. As `stackapp`: `cd /srv/stack && git clone <your-repo-url> .` (or `git pull` if already cloned)
9. `python -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt`
10. Create `/srv/stack/backend/.env` (not committed to git) with
    `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS=stack.yourdomain.com`,
    `DATABASE_URL=postgres://stack_user:yourpassword@localhost/stack_db`
11. `python manage.py migrate`
12. `python manage.py createsuperuser` (a fresh prod admin account — don't reuse a dev password)
13. `python manage.py collectstatic --noinput`

### 4f. systemd service — keep it running, and isolated

14. Create `/etc/systemd/system/stack.service`:
    ```ini
    [Unit]
    Description=Stack Django backend
    After=network.target postgresql.service

    [Service]
    User=stackapp
    Group=stackapp
    WorkingDirectory=/srv/stack/backend
    EnvironmentFile=/srv/stack/backend/.env
    ExecStart=/srv/stack/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8001 --workers 3
    Restart=on-failure
    # Resource ceiling so a bug or traffic spike in this side project can
    # never starve the college app's resources on the same box.
    MemoryMax=1G
    CPUQuota=150%

    [Install]
    WantedBy=multi-user.target
    ```
15. `sudo systemctl daemon-reload && sudo systemctl enable --now stack.service`
16. `sudo systemctl status stack.service` → confirm `active (running)`

### 4g. Nginx — reverse proxy + serve media directly (skip S3/R2 entirely)

17. Point a subdomain's DNS A record at your VPS's IP (e.g.
    `stack.yourdomain.com`) — wherever you manage DNS for your domain
18. `sudo apt install nginx certbot python3-certbot-nginx` (skip install if
    already present for the college app)
19. Create `/etc/nginx/sites-available/stack`:
    ```nginx
    server {
        listen 80;
        server_name stack.yourdomain.com;

        location /media/ {
            alias /srv/stack/backend/media/;
        }
        location /static/ {
            alias /srv/stack/backend/staticfiles/;
        }
        location / {
            proxy_pass http://127.0.0.1:8001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
20. `sudo ln -s /etc/nginx/sites-available/stack /etc/nginx/sites-enabled/`
21. `sudo nginx -t` (config check) → `sudo systemctl reload nginx`
22. `sudo certbot --nginx -d stack.yourdomain.com` → free HTTPS, auto-configures the redirect and renewal timer

### 4h. Point the app at the real domain

23. `frontend/src/api/config.js` needs a real conditional now (LAN IP for
    local dev, `https://stack.yourdomain.com/api` for anything you hand to
    a tester or ship) — flag this to me, real code change

### 4i. Back up Postgres — a PaaS would do this for you, self-hosting doesn't

24. Back it up off the VPS, not just on it (a single box failing would
    otherwise lose everything). Simplest version, a daily cron dumping to
    your own storage of choice (S3/R2/Backblaze via `rclone`, or even scp
    to a second machine):
    ```bash
    # /etc/cron.daily/stack-db-backup
    #!/bin/bash
    pg_dump -U stack_user stack_db | gzip > /tmp/stack_$(date +%F).sql.gz
    rclone copy /tmp/stack_$(date +%F).sql.gz remote:stack-backups/
    rm /tmp/stack_$(date +%F).sql.gz
    ```
    (`sudo chmod +x /etc/cron.daily/stack-db-backup`; set up `rclone config` once first)

### Test before moving on
- [ ] `python manage.py test` from `backend/` (against the prod `.env` settings this time) still passes fully
- [ ] `curl -I https://stack.yourdomain.com/api/auth/login/` → expect `405` (POST-only, not a connection error or 500) — confirms Nginx→gunicorn→Django is actually wired end to end
- [ ] `sudo systemctl status stack.service` shows `active`, and `sudo journalctl -u stack.service -f` shows no errors while you hit a few endpoints
- [ ] Confirm the college app is completely unaffected — check it still responds normally after Stack goes live alongside it
- [ ] Full regression pass against the deployed backend instead of your LAN one: register, login, tasks, group stacks, push
- [ ] Confirm a manual `pg_dump` + the cron job both actually produce a file, and that file actually lands in off-box storage

---

## Stage 5 — Apple Developer + iOS (mirrors Stages 1–3)

Requires the **$99/year Apple Developer Program** and a Mac for the actual
Xcode-side credential work (EAS handles most of this from any OS, but some
Apple flows are Mac/Safari-only). Enroll as an **Individual** account, same
reasoning as Play Console above.

1. **developer.apple.com/programs** → enroll ($99/yr)
2. **appstoreconnect.apple.com** → **My Apps → +** → New App → bundle id `com.stack.app` (must match `frontend/app.json`'s `ios.bundleIdentifier`), pricing: Free
3. From `frontend/`: `eas credentials` → **iOS** → **Push Notifications** → let it generate/upload APNs credentials
4. `npx eas-cli build --profile development --platform ios` → install via TestFlight or an ad-hoc build on a physical iPhone

### Test before moving on
- [ ] Repeat Stage 2's two-device push test on iOS
- [ ] Full regression pass on a real iPhone — nothing behind a lock anywhere

---

## Stage 6 — Store submission

1. **Privacy Policy + Terms of Service**: both stores require a hosted
   URL before submission — this app collects accounts, avatars, push
   tokens, and microphone use (even though voice audio never leaves the
   device — the policy still needs to disclose the mic permission). A
   single static page hosted anywhere public (a GitHub Pages page, or a
   route on your own backend domain) is enough to start.
2. **Play Console**:
   - **Grow → Store presence → Main store listing** — title, short/full description, screenshots (phone + optionally tablet), feature graphic
   - **Policy → App content → Data safety** — accurately declare: account data (email), photos (avatars), microphone (voice input — used on-device, not transmitted)
   - **Policy → App content → Content rating** — fill out the questionnaire
   - **Release → Testing → Internal testing** → create a release, add testers → promote to **Closed testing** once stable → **Production** last
3. **App Store Connect**:
   - Screenshots for each required device size (App Store Connect will list exactly which sizes are mandatory)
   - **App Privacy** — same categories as Play's Data Safety form
   - Submit for review
   - Note: Apple's "Sign in with Apple" requirement only triggers if you offer *other* third-party/social logins — Stack is email/password only, so this doesn't apply
4. Before flipping either to Production: have at least one or two people who aren't you install via TestFlight / Play's testing track and run the whole flow cold

---

## Stage 7 — Marketing / launch

- **Store listing (ASO)**: a clear, keyword-relevant title/subtitle ("Stack — Daily Task Dump" type framing), a short demo video/preview showing add-task speed and the calm design, screenshots of the real UI, not marketing fluff
- **Launch channels**: Product Hunt, r/productivity / r/androidapps / r/ios (read each subreddit's self-promotion rules first), Indie Hackers, build-in-public posts during development are worth more than a single launch-day post
- **Analytics**: nothing is wired up yet — consider a lightweight product analytics tool (PostHog has a generous free tier) if you want to see where users drop off
- **Feedback loop**: keep an open Play testing track / TestFlight public link running post-launch as the cheapest way to catch bugs before they hit your full user base

---

## Cost summary

| Item | Cost |
|---|---|
| Google Play Console | $25 one-time |
| Apple Developer Program | $99/year |
| EAS builds | Free tier to start; ~$29/mo if you outgrow it |
| Backend hosting | $0 marginal — self-hosted on your existing VPS |

---

## Linear order, one line each

0. Confirm baseline (Expo Go) → 1. EAS dev-client build → 2. Firebase/Android push → **2.5. Regression pass** → 3. Google Play Console (Android) → 4. Deploy backend for real (self-hosted VPS) → 5. Apple Developer + iOS (repeat 1–3 for iOS) → 6. Store submission (both platforms) → 7. Marketing, ideally starting *before* full public launch
