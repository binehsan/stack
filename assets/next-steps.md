# Stack — Full Build-to-Launch Guide

One linear path, in order. Each stage ends with a **"Test before moving on"**
checklist — don't skip ahead until that stage's tests pass, since later
stages assume earlier ones actually work. Dashboard menu paths below are
accurate as of when this was written; third-party dashboards do reshuffle
occasionally, so if a label doesn't match exactly, look for the nearest
equivalent (e.g. "Settings" vs "Project Settings").

## Where things stand right now

- **Backend**: Django + DRF, SQLite, running locally on your LAN only
  (`0.0.0.0:8000`) — not reachable from the internet yet. Full test suite
  across all four apps (`accounts`, `tasks`, `family`, `billing`) —
  **102/102 tests passing** (`python manage.py test` from `backend/`).
- **Frontend**: Expo/React Native, off Expo Go and onto a real EAS
  dev-client build (Stage 1 done). Push notifications wired and tested
  two-device (Stage 2 done). This session added: a Pro-gated theme picker
  (Classic/Premium Purple/Forest Green/Alpine Blue, each with light+dark),
  a fix so `Entitlement` changes in Django admin actually reach the app,
  the dashboard header showing your real avatar, tapping a group-invite
  push opens an accept/decline popup, tapping a nudge push opens that group
  stack directly, voice input auto-submits when it finishes listening, and
  a few UI polish fixes (login screen's empty circle, dashboard tagline).
  None of this has been tested on a rebuilt device binary yet — see
  **Stage 2.5** below before spending anything in Stage 3.
- **App icon**: done. **Notification icon**: fixed in code, needs the next
  `eas build` to actually take effect (native asset — JS reload isn't enough).
- **Not yet done**: RevenueCat account, Google Play Console account, Apple
  Developer Program enrollment, backend deployed anywhere reachable from the
  internet, any store listing, any legal pages.

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
- [ ] No crashes when you tap the mic button or the "Upgrade to Pro" row — they should show a graceful "coming soon"-style fallback, not an error, since the native modules aren't built in yet

---

## Stage 1 — EAS account + first dev-client build

Push notifications, RevenueCat, and voice input are all **native modules**
— none of them work in Expo Go, no matter what. This stage gets you off
Expo Go and onto a real installable build, with nothing else changed yet,
so you can isolate "did the rebuild break something" from "did the new
feature break something" in later stages.

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

## Stage 2.5 — Regression pass on this session's changes

Stage 3 costs real money (Play Console's $25) and commits you to specific
product ids everywhere — worth confirming today's batch of frontend changes
actually works on-device first, all doable right now with zero new accounts.

1. Backend: from `backend/`, run `python manage.py test` → expect
   `Ran 102 tests ... OK`
2. Grant yourself Stack Pro without RevenueCat: `http://localhost:8000/admin/`
   (or your LAN IP from a phone) → log in → **Billing → Entitlements** →
   find your user (or **Add entitlement**) → check **Is lifetime** → Save
3. In the app, open `MyStackScreen` — confirm it now shows "Stack Pro —
   Lifetime" **without needing to background/foreground the app** (this is
   the bug that got fixed — it used to silently never refetch)

### Test before moving on
- [ ] **Theme picker**: `MyStackScreen` → Theme section → tap through all 4
  swatches (Classic/Premium Purple/Forest Green/Alpine Blue), and toggle
  light/dark (the sun/moon button) on each — 8 combinations total. Check
  every screen's text stays readable, and the Logo's white ring is still
  visible against the gradient in each
- [ ] Uncheck **Is lifetime** in admin, reopen `MyStackScreen` → confirms
  the theme silently falls back to Classic (not stuck on a paid theme
  you're no longer entitled to)
- [ ] **Voice input**: re-check **Is lifetime**, tap the mic, speak a short
  task → confirms it live-transcribes AND auto-adds itself once you stop
  talking, with no need to tap +. Tap mic and stay silent → confirms
  nothing gets wrongly auto-submitted
- [ ] **Dashboard avatar**: header button (top-right) shows your real
  profile photo, not the generic person icon (guests should still see the
  generic icon, since they have no avatar)
- [ ] **Group-invite popup**: from Device A, invite Device B to a group
  stack → on Device B, tap the push notification (not just open the app) →
  confirms an Accept/Decline popup appears immediately, and Accept lands
  you inside that stack
- [ ] **Nudge navigation**: Device A nudges a task onto Device B → tap that
  push notification on Device B → confirms it opens straight into the
  correct group stack
- [ ] **Leave-stack refresh**: from inside a group stack, tap "Leave this
  stack" → confirms the hub list updates immediately, no back-and-reopen needed
- [ ] Login/Register screens: confirm there's no empty circle in the
  top-left when there's nothing to go back to
- [ ] Dashboard: confirm the "Your stack, wherever u are" tagline under
  Group Stacks is gone

---

## Stage 3 — RevenueCat + Google Play Console (Android purchases)

This is the biggest stage — do the sub-steps in this exact order, since
RevenueCat's Android product entries need real Play Console identifiers to
point at, which don't exist until you've created them.

### 3a. RevenueCat — account, project, entitlement (no dependency, do first)

1. **app.revenuecat.com** → sign up (free) → **Create new project** → name it "Stack"
2. Left sidebar → **Apps** → **+ Add app** → choose **Google Play** →
   package name `com.stack.app` (matches `frontend/app.json`)
3. Left sidebar → **Entitlements** → **+ New** → identifier **`pro`**
   (exact string — the app code checks for this) → Save

### 3b. Google Play Console — pay, create app, create products

4. **play.google.com/console** → pay the **$25 one-time registration fee**
   → complete account setup
5. **Create app** → name "Stack" → fill in the required defaults (app or
   game: App; free or paid: Free; declarations) → Create
6. Inside the app → **Monetize → Products → Subscriptions** → **Create subscription**
   - Product ID: `stack_pro_monthly`
   - It'll prompt you to add a **base plan** immediately — click **Add base plan**
     - Base plan ID: `monthly` (lowercase/numbers/hyphens only — a separate id from the product id, Play requires one per subscription)
     - Billing period: Monthly
     - Set price: $2.99 (or let Play auto-convert other currencies from this)
     - Activate the base plan
7. **Create subscription** again:
   - Product ID: `stack_pro_annual`, base plan ID `annual`, billing period Yearly, price $19.99, activate
8. **Monetize → Products → In-app products** → **Create product**
   - Product ID: `stack_pro_lifetime`, price $14.99, status Active

### 3c. Back to RevenueCat — products, attach entitlement, offering

9. RevenueCat → **Products** → **+ New**, for each of the 3, using the Android identifier form `product-id:base-plan-id` for the two subscriptions, and plain id for lifetime:
   - `stack_pro_monthly:monthly`
   - `stack_pro_annual:annual`
   - `stack_pro_lifetime`
10. On each product's detail page, attach it to the `pro` entitlement
11. **Offerings** → **+ New** → identifier **`default`** → inside it, **+ New Package** for each of the 3 products → mark this offering **Current**

### 3d. Link Play Console ↔ RevenueCat

12. RevenueCat → **Project Settings → Integrations → Google Play** → follow
    the guided flow — it asks for a Play **service account** JSON key
    (Play Console → **Users and permissions** → create a service account
    via the linked Google Cloud Console, grant it **Finance** viewer
    access, download the key, upload it to RevenueCat)

### 3e. Wire the API key into the app

13. RevenueCat → **API Keys** (under your Android app) → copy the **Public** key
14. Open `frontend/app.json` → replace `extra.revenueCat.androidApiKey`'s
    `"REPLACE_WITH_REVENUECAT_ANDROID_KEY"` with the copied key (these
    public SDK keys are safe to commit — not secrets, same as the
    `eas.projectId` already sitting in this file)
15. No native rebuild needed for this — it's read at runtime — just reload the app (shake device → Reload, or restart Metro)

### Test before moving on

15. Play Console → **Testing → License testing** → add your own Google
    account's email as a license tester (lets you "buy" without being
    charged real money)

- [ ] As a free-tier account: try founding a 2nd group stack → paywall shows (`PAYWALL_GROUP_LIMIT`)
- [ ] As a free-tier account: log in on a 2nd device → paywall shows (`PAYWALL_DEVICE_LIMIT`)
- [ ] As a free-tier account: tap the mic in task input → paywall shows (`PAYWALL_VOICE`)
- [ ] Buy `stack_pro_monthly` via the in-app paywall (sandbox, no real charge as a license tester) → `MyStackScreen` flips to Pro without restarting the app
- [ ] Repeat purchase test for `stack_pro_annual` and `stack_pro_lifetime` (you may need to cancel/refund the previous sandbox purchase between tests via Play Console's order management)
- [ ] As the now-Pro account: found a 2nd group, log in on a 2nd device, use voice input — none should be gated
- [ ] Settings → **Restore Purchases** on a fresh install of the same account → Pro status comes back without a new purchase
- [ ] Confirm a 21st member invite to one group stack is rejected with the "group is full" message (`GROUP_MEMBER_CAP`) — this applies to every group regardless of tier, so test it on the free account

---

## Stage 4 — Deploy the backend for real

RevenueCat's webhook and real users' phones need to reach your backend over
the public internet — your LAN IP doesn't work once you're off your own
Wi-Fi. **Decision made**: self-host on your existing VPS (6 vCores/8GB/240GB
NVMe, currently running a college library app) rather than a PaaS —
massively more headroom than this workload needs, and $0 marginal cost.
Commands below assume Ubuntu/Debian (`apt`); adjust for your actual distro.

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
    `DATABASE_URL=postgres://stack_user:yourpassword@localhost/stack_db`,
    `REVENUECAT_WEBHOOK_SECRET=<make up a long random string>`
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

### 4h. Point the app and RevenueCat at the real domain

23. `frontend/src/api/config.js` needs a real conditional now (LAN IP for
    local dev, `https://stack.yourdomain.com/api` for anything you hand to
    a tester or ship) — flag this to me, real code change
24. RevenueCat → **Project Settings → Integrations → Webhooks** → **+ Add**
    - URL: `https://stack.yourdomain.com/api/billing/revenuecat-webhook/`
    - Authorization header value: the same string as `REVENUECAT_WEBHOOK_SECRET` in your `.env`

### 4i. Back up Postgres — a PaaS would do this for you, self-hosting doesn't

25. Once RevenueCat is live, this database holds real payment-linked
    entitlement records — back it up off the VPS, not just on it (a single
    box failing would otherwise lose everything). Simplest version, a daily
    cron dumping to your own storage of choice (S3/R2/Backblaze via `rclone`,
    or even scp to a second machine):
    ```bash
    # /etc/cron.daily/stack-db-backup
    #!/bin/bash
    pg_dump -U stack_user stack_db | gzip > /tmp/stack_$(date +%F).sql.gz
    rclone copy /tmp/stack_$(date +%F).sql.gz remote:stack-backups/
    rm /tmp/stack_$(date +%F).sql.gz
    ```
    (`sudo chmod +x /etc/cron.daily/stack-db-backup`; set up `rclone config` once first)

### Test before moving on
- [ ] `python manage.py test` from `backend/` (against the prod `.env` settings this time) still passes 102/102
- [ ] `curl -I https://stack.yourdomain.com/api/billing/entitlement/` → expect `401`, not a connection error or 500 — confirms Nginx→gunicorn→Django is actually wired end to end
- [ ] `sudo systemctl status stack.service` shows `active`, and `sudo journalctl -u stack.service -f` shows no errors while you hit a few endpoints
- [ ] Confirm the college app is completely unaffected — check it still responds normally after Stack goes live alongside it
- [ ] RevenueCat → **Webhooks** page → **Send test event** → confirm `200`, and check `journalctl -u stack.service` for the request landing
- [ ] Full regression pass against the deployed backend instead of your LAN one: register, login, tasks, group stacks, push, and one real sandbox purchase — confirm `is_pro` flips via the live webhook this time, not just locally
- [ ] Confirm a manual `pg_dump` + the cron job both actually produce a file, and that file actually lands in off-box storage

---

## Stage 5 — Apple Developer + iOS (mirrors Stages 1–3)

Requires the **$99/year Apple Developer Program** and a Mac for the actual
Xcode-side credential work (EAS handles most of this from any OS, but
some Apple flows are Mac/Safari-only).

1. **developer.apple.com/programs** → enroll ($99/yr)
2. **appstoreconnect.apple.com** → **My Apps → +** → New App → bundle id `com.stack.app` (must match `frontend/app.json`'s `ios.bundleIdentifier`)
3. From `frontend/`: `eas credentials` → **iOS** → **Push Notifications** → let it generate/upload APNs credentials
4. App Store Connect → your app → **Subscriptions** → create a Subscription Group → add `stack_pro_monthly` and `stack_pro_annual` inside it with matching prices; separately under **In-App Purchases** create `stack_pro_lifetime` as a Non-Consumable
5. RevenueCat → **Apps → + Add app** → App Store → same bundle id → generate/copy the iOS **Public** API key → paste into `frontend/app.json`'s `iosApiKey`
6. RevenueCat → **Project Settings → Integrations → App Store Connect** → link via an App Store Connect API key (App Store Connect → **Users and Access → Integrations → App Store Connect API** → generate a key with **Admin** or **App Manager** role, download the `.p8`, upload to RevenueCat)
7. `npx eas-cli build --profile development --platform ios` → install via TestFlight or an ad-hoc build on a physical iPhone (simulators can't complete real purchases)

### Test before moving on
- [ ] Repeat Stage 2's two-device push test on iOS
- [ ] App Store Connect → **Users and Access → Sandbox Testers** → create a sandbox Apple ID, sign into it on-device (Settings → App Store → Sandbox Account), repeat Stage 3's full purchase/restore/gating test suite on iOS
- [ ] Cross-platform check: buy Pro on Android with one account, confirm the same account shows Pro when logged into the iOS build (this is what makes the backend the source of truth, not RevenueCat's per-store state)

---

## Stage 6 — Store submission

1. **Privacy Policy + Terms of Service**: both stores require a hosted
   URL before submission — this app collects accounts, avatars, push
   tokens, device ids, and microphone use (even though voice audio never
   leaves the device — the policy still needs to disclose the mic
   permission). A single static page hosted anywhere public (a GitHub
   Pages page, or a route on your own backend domain) is enough to start.
2. **Play Console**:
   - **Grow → Store presence → Main store listing** — title, short/full description, screenshots (phone + optionally tablet), feature graphic
   - **Policy → App content → Data safety** — accurately declare: account data (email), photos (avatars), microphone (voice input — used on-device, not transmitted), device/push identifiers
   - **Policy → App content → Content rating** — fill out the questionnaire
   - **Release → Testing → Internal testing** → create a release, add testers → promote to **Closed testing** once stable → **Production** last
3. **App Store Connect**:
   - Screenshots for each required device size (App Store Connect will list exactly which sizes are mandatory)
   - **App Privacy** — same categories as Play's Data Safety form
   - Submit for review
   - Note: Apple's "Sign in with Apple" requirement only triggers if you offer *other* third-party/social logins — Stack is email/password only, so this doesn't apply
   - Apple reviews subscription apps closely for clear pricing disclosure and a working Restore Purchases — both are already in the paywall UI
4. Before flipping either to Production: have at least one or two people who aren't you install via TestFlight / Play's testing track and run the whole flow cold

---

## Stage 7 — Marketing / launch

- **Store listing (ASO)**: a clear, keyword-relevant title/subtitle ("Stack — Daily Task Dump" type framing), a short demo video/preview showing add-task speed and the calm design, screenshots of the real UI, not marketing fluff
- **Launch channels**: Product Hunt, r/productivity / r/androidapps / r/ios (read each subreddit's self-promotion rules first), Indie Hackers, build-in-public posts during development are worth more than a single launch-day post
- **Pricing**: consider a free trial on the monthly/annual plans via RevenueCat's offering config (dashboard-only, no code change — **Offerings → default → edit package → Introductory Offer**) — free trials meaningfully lift conversion for indie subscription apps
- **Analytics**: nothing is wired up yet — consider a lightweight product analytics tool (PostHog has a generous free tier) if you want to see where free users drop off before hitting a paywall
- **Feedback loop**: keep an open Play testing track / TestFlight public link running post-launch as the cheapest way to catch bugs before they hit your full user base

---

## Cost summary

| Item | Cost |
|---|---|
| Google Play Console | $25 one-time |
| Apple Developer Program | $99/year |
| RevenueCat | Free under $2,500/mo tracked revenue, 1% above |
| EAS builds | Free tier to start; ~$29/mo if you outgrow it |
| Backend hosting | $0 marginal — self-hosted on your existing VPS |
| Store commission | 15% under $1M/year revenue on both stores |

---

## Linear order, one line each

0. Confirm baseline (Expo Go) → 1. EAS dev-client build → 2. Firebase/Android push → **2.5. Regression pass on this session's changes** → 3. RevenueCat + Play Console (Android purchases) → 4. Deploy backend for real (self-hosted VPS) → 5. Apple Developer + iOS (repeat 1–3 for iOS) → 6. Store submission (both platforms) → 7. Marketing, ideally starting *before* full public launch
