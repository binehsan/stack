# Stack — 6-day launch roadmap

A working-competence plan, not a mastery plan: each day pairs one real,
shipped deliverable with the concept you need to understand to do it.

## Where things stand right now (updated 2026-08-19)

**This document is historical** — it was written for the original
native-app-store launch plan (Days 1–7 below). That plan changed on
2026-08-18: after learning that Apple/Google's dispute processes can
forward a developer's contact info to a complainant regardless of trader
status, the app pivoted to **PWA-first** instead — Apple's $99 fee was
refunded, and `PWA/` (a full-featured Progressive Web App, superseding the
old plain `website/`) is now the primary distribution channel. The Business
strategy section at the bottom (free forever, no paid tier) still holds;
everything about *how it ships* below it does not.

**For current, accurate deployment status, setup steps, and the day-to-day
update workflow, see [`PWA/DEPLOYMENT.md`](PWA/DEPLOYMENT.md) instead of
this file.** As of tonight (2026-08-19): rate limiting on auth endpoints,
a real Privacy Policy page, and automated daily DB backups (all three
were still-open items in this doc's old Day 3 section below) are now
**done** — see `DEPLOYMENT.md` for what that actually covers.

The native Android APK still exists and still works (same backend, same
account) — it's just personal-use now rather than the public distribution
plan; see `PWA/DEPLOYMENT.md`'s notes on that. Days 1–7 below are kept for
reference (some of the underlying technical explanations — Postgres,
Docker, GDPR — are still accurate) but the day-by-day plan itself no
longer reflects what's actually being built.
- No uptime/error monitoring (Day 6).

So: the code and the paid accounts are both ready. What's left is entirely
*operational* — standing up the server, filling in the two consoles, and
QA. That's Days 1–6 below, in order.

---

## Day 1 — Install Docker, understand Postgres, test it for real

### 1a. Install Docker Desktop (Windows), button by button

You need this locally today to test Postgres, and you'll want it later
too (running the same stack locally is the fastest way to debug a
deploy problem before blaming the VPS).

1. Go to **docker.com/products/docker-desktop** → click **Download for
   Windows**.
2. Run the installer (`Docker Desktop Installer.exe`). On the
   "Configuration" screen, leave **"Use WSL 2 instead of Hyper-V"**
   checked (recommended, and required for what follows) → **Ok**.
3. If Windows tells you WSL2 isn't installed: open **PowerShell as
   Administrator** → run `wsl --install` → restart your PC when it asks.
   Then re-run the Docker installer if it didn't finish.
4. After install, Docker Desktop launches automatically. Accept the
   subscription service agreement (personal/small-business use is free).
   You can skip signing in — a Docker Hub account isn't required for
   anything in this project.
5. Look for the **whale icon** in your system tray (bottom-right, may be
   under the `^` overflow arrow). Solid/steady whale = the Docker engine
   is running. If it's animating/loading, wait for it to settle before
   running any `docker` command.
6. **Verify it works** — open PowerShell and run:
   ```powershell
   docker --version
   docker run hello-world
   ```
   The second command downloads a tiny test image and runs it once,
   printing a "Hello from Docker!" message. If you see that, everything's
   installed correctly.

**The Docker Desktop window itself**, for later reference — open it from
the tray icon:
- **Containers** tab (left sidebar) — every container you've run, running
  or stopped. Each row has a ▶ **Start**, ⏸ **Stop**, and 🗑 **Delete**
  button, and clicking the row name opens its **Logs**, **Inspect**, and
  a live **Terminal** into that container.
- **Images** tab — every image you've pulled or built locally (an image
  is the *template*; a container is a *running instance* of one — see
  below). You can delete unused ones here to reclaim disk space.
- **Volumes** tab — named volumes (persistent data that survives a
  container being deleted and recreated). This is where `postgres_data`
  will show up once you run the real stack in Day 2.
- Gear icon (top-right) → **Settings** → **Resources → WSL Integration** —
  only matters if you also use WSL directly for other tools; not needed
  for this project since you'll run everything from PowerShell.

### 1b. What Docker actually is, in plain terms

- **Image** = a frozen, versioned snapshot of "a program plus everything
  it needs to run" (OS libraries, dependencies, config) — like a recipe.
  `postgres:17-alpine` is an image: a specific version of Postgres, plus
  a minimal Linux filesystem underneath, all bundled together.
- **Container** = a running instance of an image — like a dish actually
  cooked from that recipe. You can start, stop, and delete containers
  freely without touching the image they came from; deleting a container
  never deletes its image, and you can run many containers from the same
  image at once.
- Why this matters for you: it means "install Postgres" never actually
  installs anything onto your Windows machine or the VPS — Docker just
  downloads the image once and runs a container from it. Deleting the
  container later leaves your OS exactly as clean as before you started.
- **Volume** = a chunk of disk space Docker manages *outside* any single
  container, that a container mounts in. Without one, a container's own
  filesystem is wiped the moment the container is deleted — fine for the
  container's code, catastrophic for a database's actual data. Every
  `postgres` container in this project mounts a named volume
  (`postgres_data`) so your rows survive `docker compose down` and
  rebuilds.
- **Network** = Docker gives every stack you start with `docker compose`
  a private network where containers reach each other **by service
  name** (`backend` can open a connection to literal hostname `postgres`
  — Docker resolves that to the right container's private IP). Nothing
  outside that stack can reach `postgres:5432` directly, which is exactly
  the isolation you want for a database.

### 1c. Postgres vs SQLite, in one paragraph

SQLite isn't a program you run — it's a code library your app links
against, and your whole database is one file (`db.sqlite3`) that Django
reads and writes directly. No server, no login, no network; whichever
process touches the file *is* the database. Zero setup, but it locks the
whole file when something writes to it, which becomes a real bottleneck
once more than one request can arrive at the same instant (gunicorn already
runs 3 worker processes). Postgres is a real, separate program that runs
continuously in the background — your app talks to it over a network
connection (even if that connection is just to `localhost`), the same way
it'd talk to any external API. Because it's built to serve many connections
at once, it handles concurrent writes properly, and it has actual user
accounts with passwords (`POSTGRES_USER`/`POSTGRES_PASSWORD` — a login, not
a filename).

A few more concepts worth actually knowing, not just memorizing:
- **Port 5432** is Postgres's default network port — the number after the
  IP/hostname that says *which* program on that machine to talk to (like
  an apartment number on a street address). `-p 5432:5432` in the command
  below maps "port 5432 inside the container" to "port 5432 on your
  Windows machine," so tools running outside Docker (like your Django app)
  can reach it at `localhost:5432`.
- **ACID** is the property that makes a real database safer than a flat
  file under concurrent writes — Atomicity (a transaction either fully
  happens or not at all, never half-written), Consistency (data always
  satisfies your model's rules), Isolation (concurrent transactions don't
  see each other's half-finished work), Durability (once committed, a
  crash a millisecond later can't lose it). SQLite actually has this too
  for a single writer; Postgres extends it cleanly across many concurrent
  writers, which is the actual gap you're closing here.
- A **connection string** (or the separate `POSTGRES_HOST`/`PORT`/
  `USER`/`PASSWORD`/`DB` env vars Django reads here) is just "the address
  and credentials to dial in" — same idea as a URL, different transport.

### 1d. Test it locally, before touching the VPS at all

Don't try to run the full `docker-compose.yml` stack yet — the `caddy`
service in it wants a real public domain to get a TLS certificate from
Let's Encrypt, which won't work from your laptop. Instead, run a single
throwaway Postgres container:

```powershell
docker run -e POSTGRES_PASSWORD=test -p 5432:5432 postgres:17-alpine
```

Leave that terminal running (it's attached to the container's output) and
open a second PowerShell window for everything else. In `backend/.env`,
temporarily uncomment and set:

```
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=test
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Run the app normally:

```powershell
cd backend
venv\Scripts\python manage.py migrate
venv\Scripts\python manage.py runserver
```

Click around — sign up, add tasks, drag-reorder, star/dump, try Group
Stacks. This proves the whole app works against real Postgres before
production ever sees it. When you're done testing:
- `Ctrl+C` in the first terminal to stop the Postgres container (or hit
  **Stop** on it in Docker Desktop's Containers tab)
- comment those four `POSTGRES_*` lines back out in `backend/.env` to go
  back to plain SQLite for day-to-day dev (nothing else changes —
  `settings.py` falls back automatically whenever `POSTGRES_DB` is unset)

### 1e. Security housekeeping (do this today, it's 10 minutes)

- Generate a real `DJANGO_SECRET_KEY`:
  ```powershell
  venv\Scripts\python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
  ```
  Save it in a password manager. This is the key Django uses to sign
  session cookies and password-reset tokens — if it leaks, someone can
  forge a valid login for any user without knowing their password. Never
  commit it; it only ever lives in `backend/.env` (gitignored) or the VPS's
  environment.
- Generate a real `POSTGRES_PASSWORD` the same way (or
  `python -c "import secrets; print(secrets.token_urlsafe(24))"`) — not
  `change-me`.
- ~~Start Apple Developer Program enrollment~~ — **done**, already
  enrolled as an Individual account.

---

## Day 2 — VPS provisioning + the real Docker stack

### What you're about to run, in one paragraph

`docker-compose.yml` describes three containers: `postgres` (the database),
`backend` (your Django app via gunicorn), and `caddy` (a reverse proxy that
also gets you free, auto-renewing HTTPS). Docker gives all three a private
network where they reach each other by service name — `backend` talks to
`postgres:5432`, and the public internet only ever reaches `caddy` on ports
80/443, which forwards `/api/*` and `/admin/*` to `backend:8000` and serves
the built website + Django's static/media files directly. Named volumes
(`postgres_data`, `media_data`, `static_data`) keep your actual data on the
VPS's disk, separate from the containers themselves — a container gets
thrown away and rebuilt on every deploy, a volume doesn't.

### The Docker workflow you'll actually use, command by command

Everything below runs **on the VPS**, over SSH, from inside `/srv/stack`
(where the repo is cloned). `docker compose` (the space matters — it's the
plugin, not the older standalone `docker-compose` binary) always reads
`docker-compose.yml` in the current directory and acts on the whole stack
at once, using the *service names* (`postgres`, `backend`, `caddy`) from
that file rather than raw container names.

| Command | What it does |
|---|---|
| `docker compose up -d --build` | Build any images that changed, then start (or restart) every service in the background (`-d` = detached, don't tie up your terminal). This is "deploy" — you'll run this by hand once today, then never again (Actions does it for you after). |
| `docker compose ps` | List this stack's containers and whether each is up/healthy — your first check after any command. |
| `docker compose logs -f` | Stream logs from every service live, `Ctrl+C` to stop watching (doesn't stop the containers). Add a service name (`docker compose logs -f backend`) to watch just one. |
| `docker compose restart backend` | Restart one service without rebuilding it — useful after an env var change. |
| `docker compose down` | Stop and remove all the *containers* (not the volumes — your Postgres data survives this). Use before a clean `up` if something's in a weird state. |
| `docker compose exec backend bash` | Open a shell *inside* the running `backend` container — useful for a one-off `python manage.py <something>` in production without redeploying. |
| `docker image prune -f` | Delete old, no-longer-referenced images — `deploy.yml` already runs this after every deploy so disk usage doesn't creep up over time. |

You can also watch all of this happen visually in **Docker Desktop's
Containers tab** if you ever run the stack locally (Windows won't run the
actual VPS, but the same `docker-compose.yml` works fine for a local dry
run without the `caddy` service — just comment it out temporarily, since
it needs a real public domain for its TLS certificate).

### One-time VPS setup

1. Point your domain's DNS A record at the VPS's IP
   (`stack.hellosyntax.dev` → your VPS's public IPv4).
2. SSH in **once**, manually:
   ```bash
   curl -fsSL https://get.docker.com | sh   # installs Docker + Compose on the VPS
   git clone <your-repo-url> /srv/stack
   cd /srv/stack
   ```
3. Fill in real values:
   ```bash
   cp backend/.env.example backend/.env
   # edit backend/.env: DJANGO_SECRET_KEY, DJANGO_DEBUG=false,
   # DJANGO_ALLOWED_HOSTS + CORS_ALLOWED_ORIGINS to your real domain,
   # FRONTEND_URL, email settings once you have them.

   cp .env.example .env
   # edit .env: DOMAIN=stack.hellosyntax.dev, POSTGRES_PASSWORD=<the one you generated>
   ```
4. Bring it up:
   ```bash
   docker compose up -d --build
   ```
5. Watch it come up and check for errors:
   ```bash
   docker compose logs -f
   ```
6. Visit `https://stack.hellosyntax.dev` in a browser. You should get a
   real HTTPS cert automatically (Caddy does this the moment it can reach
   Let's Encrypt on port 80/443 — no certbot, no manual cert install).

### Wire up zero-touch deploys (GitHub Actions)

This is the part that means you stop SSHing in for routine updates.
`.github/workflows/deploy.yml` already exists in the repo — it SSHes into
your VPS *for you* whenever you push to `main`, using a deploy key stored
as a GitHub secret, and runs `git pull && docker compose up -d --build`.

1. On your own machine: `ssh-keygen -t ed25519 -f stack_deploy_key -N ""`
2. Append `stack_deploy_key.pub`'s contents to the VPS's
   `~/.ssh/authorized_keys` (the same user that owns `/srv/stack`).
3. In GitHub → this repo → Settings → Secrets and variables → Actions, add:
   - `VPS_HOST` — the VPS's IP or hostname
   - `VPS_USER` — the SSH user from step 2
   - `VPS_SSH_KEY` — the *private* half of the key pair (`stack_deploy_key`,
     not the `.pub` file)
4. Push a trivial change to `main` and watch the Actions tab — confirm it
   actually SSHes in and redeploys before you rely on it.

From here on: **`git push` is the deploy.**

---

## Day 3 — Security + GDPR pass

Already true, no action needed: HTTPS everywhere (Caddy), passwords
hashed (Django's default, never touched directly), secrets kept out of git
(`.env` + `.gitignore`), account deletion cascades to all of a user's data
(`DeleteAccountView` + `on_delete=CASCADE` on tasks/group memberships) —
that last one covers most of GDPR's "right to erasure" already.

Still needed:

- [x] **Rate limiting on auth endpoints.** Done 2026-08-19 — DRF
      `ScopedRateThrottle`, `throttle_scope = 'auth'` on
      Login/Register/PasswordResetRequest, 10/min per IP (see
      `backend/config/settings.py`'s `REST_FRAMEWORK` and
      `accounts/views.py`). Tested in `accounts/tests.py`.
- [x] **Publish a real Privacy Policy.** Done 2026-08-19 — `PWA/src/pages/Privacy.jsx`,
      linked from the footer and the signup form. (Terms of Service still
      not written — lower priority now that store submission isn't the
      near-term plan.)
- [x] **Database backups.** Done 2026-08-19 — automated, see
      `PWA/DEPLOYMENT.md`'s step 12 (`deploy/scripts/backup-db.sh` + a
      systemd timer, daily, 14-day local retention). Off-box copy (via
      `rclone`) is stubbed in but not yet wired to a real storage
      provider — still worth doing, not blocking.
- [ ] Confirm `DJANGO_DEBUG=false` and real `DJANGO_ALLOWED_HOSTS` /
      `CORS_ALLOWED_ORIGINS` are actually set on the VPS (Day 2 covers
      this — just don't skip it).

---

## Day 4 — Mobile store submissions

- EAS production build for both platforms: `eas build --platform all`.
- Store listings on both consoles: screenshots, description, and the
  Privacy Policy link from Day 3 (required by both stores).
- Both listings should declare the app as **Free**, no in-app purchases —
  Stack has no paid tier anywhere (see Business strategy note below).

### Screenshots & marketing assets, fast (Canva)

You don't need a designer for this — Canva has ready-made App
Store/Play Store screenshot templates that already have phone device
frames at the correct pixel dimensions built in.

1. **Capture the raw screenshots first.** From the iOS Simulator, press
   **Cmd+S** (or File → Save Screen) to save a full-resolution PNG. From
   an Android emulator, click the camera icon in the emulator's sidebar,
   or run `adb exec-out screencap -p > shot.png` from a real device. Grab
   one clean screenshot per feature you want to show off (5–6 is plenty):
   the main stack view, Focus, a Group Stack, the theme picker, and maybe
   the recap/streak screen.
2. **Open Canva** (canva.com, free tier is enough to start) → search
   templates for **"App Store Screenshot"** or **"Google Play Store
   Screenshot"** in the template search bar → pick a template whose
   layout style you like (headline text above/below a phone frame is the
   most common, and reads well at thumbnail size in the store listing).
3. For each screen: **double-click the phone frame's placeholder image**
   and upload/drop in your raw screenshot — Canva crops it into the frame
   automatically. Edit the headline text to one short, benefit-led line
   per screen (e.g. "Star what matters today," not "Focus feature").
   Duplicate the page (right-click → Duplicate page) for each of your
   5–6 screenshots and swap the image + headline on each copy.
4. **Match your brand**: pick 1–2 of Stack's actual gradient colors (see
   `frontend/src/theme.js`) as the template's background instead of
   Canva's default, so the screenshots look like they belong to the same
   app as the store icon.
5. **Export**: File → Download → PNG, "Suggested size" — Canva's app
   store templates are already sized to Apple's and Google's required
   dimensions, so you don't need to think about exact px numbers
   yourself. If a template isn't pre-sized for the specific device you
   need, Canva Pro's **Resize** tool (free 7-day trial, ~$13/mo after)
   batch-resizes a whole design to every required dimension in one click
   — worth the trial period alone if you're doing this for both stores.
6. **Required sizes, for reference** (so you can sanity-check what Canva
   gives you): iOS needs at least the 6.9" iPhone size (1320×2868 or
   1290×2796 depending on device generation — App Store Connect tells you
   exactly which ones are mandatory when you get there); Android needs
   phone screenshots (any size ≥320px, 16:9 or 9:16) plus an optional
   1024×500 **feature graphic** banner for the top of the Play listing —
   also easy to make from a Canva "YouTube Thumbnail"-shaped template
   resized to 1024×500.
7. If you want it faster still and don't mind losing some design control:
   a dedicated tool like **AppLaunchpad**, **Screenshots.pro**, or
   **Shotbot** auto-generates the whole set from raw screenshots + a
   color/copy input in a couple of minutes — Canva gives you more control
   over the actual design, these give you more speed.

---

## Day 5 — React / React Native, understood through your own code

- Read `website/src/components/dashboard/TaskItem.jsx` side-by-side with
  `frontend/src/components/TaskItem.js` — same feature, two frameworks. The
  fastest way to actually see what React Native does differently from
  React is comparing two implementations of the exact same thing you
  already understand conceptually.
- Full manual QA pass, end to end: signup → welcome → dashboard →
  drag-reorder → forgot password → mobile app parity check.

---

## Day 6 — Buffer + launch readiness

- Catch up on whichever day slipped — something always does.
- Basic uptime/error monitoring, so you find out about a crash before a
  user tells you (Sentry's free tier is the low-effort option).
- Go/no-go review against the Day 3 checklist.

---

## Business strategy — Stack is free, full stop

**Decision (2026-08-18): no paid tier, no ads, no IAP — anywhere, ever,**
unless the app grows into a real business later, at which point it'd get
its own LLC and a fresh set of developer accounts rather than retrofitting
monetization onto this setup. Both the RevenueCat mobile IAP flow and the
website's Stripe subscription (`WebSubscription`, the old `billing`
Django app) have been fully removed from the codebase, not added-but-disabled.

Reasoning: publish as an **Individual** account on both the App Store and
Google Play. Zero revenue means non-trader status on both platforms, which
means no forced public address disclosure (EU DSA on Apple, the
merchant-account trigger on Google) — the thing that made "sell a paid tier
from an Individual account" risky in the first place. The one cost that
doesn't go away is Apple's $99/yr Developer Program fee; everything else is
effectively free to run (VPS hosting is already sunk cost from an unrelated
client project). If Stack ever becomes worth monetizing, that's a fresh
scoping decision paired with forming an LLC and a new Organization account
— not a feature to bolt onto the current free app. (Google Play does
support transferring an existing app's users/reviews/ratings to a new
developer account via Play Console's **Setup → App transfer** if that day
comes — it's not a from-scratch republish.)
