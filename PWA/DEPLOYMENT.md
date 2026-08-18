# Stack PWA — Deployment & Update Guide

What actually runs where, what to test before shipping, how tonight's first
deploy works, and what a routine code change looks like afterward.

---

## Architecture — what's actually in Docker (and what isn't)

**Two containers, not one, and the PWA isn't in either of them:**

| Piece | Where it runs | Why |
|---|---|---|
| **Postgres** | Docker container | Needs to be a real, isolated database server — see `docker-compose.yml`. |
| **Backend (Django/gunicorn)** | Docker container | Bound to `127.0.0.1:8001` only — not reachable from outside this machine directly. |
| **PWA** | Plain static files (`PWA/dist/`) on the VPS's own filesystem | Just HTML/CSS/JS after `npm run build` — no server-side code, no container needed. Served straight off disk. |
| **nginx** | Already running on the host (not in Docker) | The thing the public internet actually reaches on 80/443. Reverse-proxies `/api/` and `/admin/` to the backend container, serves `/media/` + `/static/` from bind-mounted folders, and serves the PWA's `dist/` as a static single-page app. |
| **The college library app (elibrary)** | Its own separate nginx server block + whatever app server it runs | Completely unaffected — Stack gets a second server block (`deploy/nginx/stack.conf`) added alongside it, not instead of it. |

Why not put the PWA in a container too? It doesn't need one — a container
buys you process isolation and a runtime for something that has to keep
*running* (like gunicorn). The PWA build has no runtime at all once built;
it's just files nginx reads off disk. Wrapping that in a container would
add complexity (another image to build, another thing to keep in sync)
for zero benefit.

Why not put nginx itself in a container (like the earlier Caddy-based plan
did)? Because this VPS already has a real nginx bound to ports 80/443 for
the elibrary app — a containerized reverse proxy would be fighting over
the same ports. Extending the nginx that's already there is the only
option that doesn't risk breaking the existing site.

---

## What's installed where

**Your Windows machine (local dev):**
- Python + venv (already set up) — runs the backend locally
- Node.js (already set up) — runs/builds the PWA locally
- Docker Desktop — only needed for the one-off "test against real Postgres"
  check; not required for day-to-day dev (SQLite is the local default)
- `cloudflared` — only needed for phone-testing via tunnel before things are
  live on the real domain

**The VPS (Rocky Linux):**
- Docker CE (via `dnf`, the RHEL repo — not the Debian one)
- Node.js (via NodeSource) — needed on the host itself now, to build the
  PWA's static files; Docker alone doesn't cover this since the PWA isn't
  containerized
- nginx + certbot — already installed and running for elibrary; Stack just
  adds a new config file, doesn't reinstall anything
- git — to pull deploys

---

## SSH from Windows instead of the RDP GUI

RDP is fine for the one-time GUI-only tasks, but every command in this
guide is much faster over SSH — no remote desktop lag, and you can
copy-paste whole command blocks instead of retyping them through a slow
remote session.

1. **Find the VPS's IP** — it's whatever address your RDP client is
   already pointed at (check its connection settings), or in your IONOS
   account's server/VPS overview page.
2. Windows 10/11 ships an SSH client already — open **PowerShell** and run:
   ```powershell
   ssh <your-username>@<vps-ip>
   ```
   If PowerShell says `ssh` isn't recognized (rare, only on older/stripped
   Windows installs): `Settings → System → Optional Features → Add a
   feature → OpenSSH Client → Install`, then reopen PowerShell.
3. First connection asks to confirm the server's fingerprint — type `yes`.
4. Enter your VPS user's password when prompted (whatever you already log
   into RDP with). You're now in a full terminal — this is what every
   command block below runs in, instead of clicking through the RDP GUI.

**Optional but worth it if you'll SSH in often**: set up a key so you're
not typing a password every time.
```powershell
# On your PC, PowerShell — generates a new keypair if you don't have one:
ssh-keygen -t ed25519
# Then copy it to the VPS (still asks for your password once, this once):
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh <your-username>@<vps-ip> "cat >> ~/.ssh/authorized_keys"
```
After that, `ssh <your-username>@<vps-ip>` logs straight in, no password.

---

## Before deploying tonight — local checklist

- [ ] **Commit and push everything.** `git status` currently shows ~133
      uncommitted files — the entire `PWA/` folder, the web push backend
      code, `docker-compose.yml`/nginx changes, all of it. The VPS deploy
      works by `git pull`; nothing uncommitted ever reaches it. Do this
      first, before anything else below.
- [ ] `cd backend && venv\Scripts\python manage.py test` — all green
      (88 tests as of this session)
- [ ] `cd PWA && npm run build` — no errors, both the main build and the
      `sw.js` service-worker build
- [ ] Full manual pass through the tunnel: sign up, log in,
      add/complete/star/delete a task, drag-reorder, create a group stack,
      invite/accept, nudge, voice input, turn on notifications and confirm
      a push actually arrives, share-to-Stack from another app,
      recap/carry-forward showing up correctly, theme picker, avatar
      upload showing a real photo.
- [ ] **Offline queue**: toggle the phone into airplane mode, add/complete
      a couple of tasks (they should stay visible with a "N pending" badge
      in the header, not vanish), turn airplane mode back off, confirm they
      sync and the badge clears.
- [ ] Install fresh and check the **home-screen icon isn't clipped** — this
      is what the new maskable icon fixes; if it still looks cropped, the
      install used a stale manifest, reinstall from a fresh build.
- [ ] Double check `backend/.env` (the real VPS one you're about to create)
      will have `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS=stack.hellosyntax.dev`,
      `CORS_ALLOWED_ORIGINS=https://stack.hellosyntax.dev`,
      `FRONTEND_URL=https://stack.hellosyntax.dev`, both `VAPID_*` keys, and
      (optional) `SENTRY_DSN` if you've set up a Sentry account by then.

---

## Postgres credentials — not set up yet

Checked: **no root `.env` file exists yet**, only `.env.example` with the
placeholder `POSTGRES_PASSWORD=change-me`. Nobody's decided the real
production Postgres username/password yet — that happens as part of step 5
below, not before. Generate one fresh when you get there:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(24))"
```
(A real value *was* generated and typed into this guide earlier in the
session it was written — deliberately removed from here afterward, since
this file is committed to git and a production database password has no
business sitting in tracked plaintext. Generate a new one; the old value
was never actually used to stand up a real database, so there's nothing to
rotate.)

This only needs to exist in **one place**: `.env` in the repo root **on the
VPS** (never committed — it's gitignored, and `docker-compose.yml` reads it
via `${POSTGRES_PASSWORD}` substitution to configure both the `postgres`
container itself and the `backend` container that connects to it). Your
local Windows machine doesn't need this at all unless you're doing the
optional local-Postgres test from earlier in this session, in which case
that was always a disposable `docker run` throwaway with its own separate
password (`test`), unrelated to this real one.

## Deploying tonight (first time only) — every command, in order

Run all of this over SSH (see above), not through the RDP GUI. One block
per stage; run each fully before moving to the next.

**1. Docker**
```bash
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $(whoami)
```
Log out and back in (close and reopen your SSH session) so the group
change takes effect, then confirm:
```bash
docker --version
docker compose version
```

**2. Node.js**
```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
node --version
```

**3. Dedicated user + directory**
```bash
sudo adduser stackapp
sudo mkdir -p /srv/stack
sudo chown stackapp:stackapp /srv/stack
sudo usermod -aG docker stackapp
sudo su - stackapp
```
Everything from here on runs as `stackapp` (your prompt should now show
that username).

**4. Clone the repo**
```bash
cd /srv/stack
git clone <your-repo-url> .
```

**5. Environment files**
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
In the editor, set (leave everything else as its default):
```
DJANGO_SECRET_KEY=<paste output of the command below>
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=stack.hellosyntax.dev
CORS_ALLOWED_ORIGINS=https://stack.hellosyntax.dev
FRONTEND_URL=https://stack.hellosyntax.dev
VAPID_PUBLIC_KEY=<from your local backend/.env — public, safe to reuse as-is>
VAPID_PRIVATE_KEY=<from your local backend/.env — NOT reproduced here, this file is committed to git>
VAPID_CLAIMS_EMAIL=amenbinehsan@gmail.com
# Optional — leave blank to skip error monitoring entirely. Create a free
# project at sentry.io (Platform: Django) to get this.
SENTRY_DSN=
```
If you do set `SENTRY_DSN`, also set the PWA's matching one before that
build step: `PWA/.env`'s `VITE_SENTRY_DSN` (separate sentry.io project,
Platform: React — same account is fine, two projects under it).
Save and exit nano: `Ctrl+O`, `Enter`, `Ctrl+X`. Generate the secret key
first if you haven't already:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```
Then the Postgres credentials file:
```bash
cp .env.example .env
nano .env
```
Set:
```
POSTGRES_DB=stack
POSTGRES_USER=stack
POSTGRES_PASSWORD=<generate fresh — see "Postgres credentials" section above>
```
Save and exit the same way.

**6. Bring up Postgres + backend**
```bash
docker compose up -d --build
docker compose ps
```
Both `postgres` and `backend` should show as running/healthy. Migrations
run automatically on every container start (see `backend/entrypoint.sh`) —
no separate migrate step needed here.

Create an admin login while you're at it — needed for `/admin/` and
`/admin/stats/`:
```bash
docker compose exec backend python manage.py createsuperuser
```

**7. Build the PWA**
```bash
cd PWA
npm ci
npm run build
cd ..
```

**8. nginx**
```bash
sudo cp deploy/nginx/stack.conf /etc/nginx/conf.d/stack.conf
sudo nginx -t
```
Must print `syntax is ok` / `test is successful` before continuing.

**9. SELinux** (Rocky-specific — skip this on an Ubuntu guide and nginx
silently 403s everything, even with correct file permissions)
```bash
sudo dnf install -y policycoreutils-python-utils
sudo setsebool -P httpd_can_network_connect on
sudo semanage fcontext -a -t httpd_sys_content_t "/srv/stack(/.*)?"
sudo restorecon -Rv /srv/stack
```

**10. DNS + HTTPS certificate**

In your DNS provider, add an A record: `stack.hellosyntax.dev` → this
VPS's public IP. Wait a few minutes for it to propagate, then:
```bash
sudo certbot --nginx -d stack.hellosyntax.dev
```
Follow its prompts (email, agree to terms). It rewrites
`/etc/nginx/conf.d/stack.conf` in place to add the HTTPS block — don't
hand-edit SSL directives yourself before this.

**11. Verify**
```bash
curl -I https://stack.hellosyntax.dev/api/auth/login/
```
Expect `405 Method Not Allowed` (it's POST-only) — not a connection error,
not a 502. Then open `https://stack.hellosyntax.dev` in a real browser.

**12. Automated daily database backups**
```bash
sudo cp /srv/stack/deploy/systemd/stack-backup.service /etc/systemd/system/
sudo cp /srv/stack/deploy/systemd/stack-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now stack-backup.timer
```
Runs daily at 3:30am (VPS local time), dumps Postgres, gzips it into
`/srv/stack/backups/`, keeps 14 days, deletes older ones automatically.
Test it actually works right now rather than waiting until 3:30am:
```bash
sudo systemctl start stack-backup.service
sudo systemctl status stack-backup.service   # should show "Succeeded"
ls -lh /srv/stack/backups/
```
This alone only protects against a bad migration or accidental deletion —
it's still on the same disk as everything else, so it doesn't survive the
VPS itself dying. `deploy/scripts/backup-db.sh`'s trailing comment has the
one-line addition (via `rclone`) to also copy each backup off-box once
you've picked a storage provider (Backblaze B2 and S3-compatible storage
both have workable free tiers) — worth doing, just not blocking tonight's
launch.

---

## After first deploy — testing on the real domain

Same checklist as the local pre-flight pass, but now against
`https://stack.hellosyntax.dev` directly — no tunnel needed anymore, this
*is* the real thing:

- [ ] Loads with a real padlock/certificate, no browser warnings
- [ ] Installs to home screen (Android: real icon, not clipped, no Chrome
      badge, no address bar once installed)
- [ ] Push notification round-trip works end to end
- [ ] Share Target shows "Stack" in the Android share sheet
- [ ] Offline queue: airplane mode, add a task, reconnect, confirm it syncs
- [ ] `https://stack.hellosyntax.dev/admin/stats/` loads and shows real
      numbers (log in with your Django superuser)
- [ ] If `SENTRY_DSN`/`VITE_SENTRY_DSN` are set: trigger a deliberate error
      (e.g. temporarily throw inside a component) and confirm it shows up
      in the Sentry dashboard, then remove the test error
- [ ] The existing elibrary app is completely unaffected — check it still
      responds normally

---

## Monitoring Docker remotely, without SSH — Portainer

Once, over SSH (or the RDP terminal), install a small web dashboard for
the Docker containers themselves:
```bash
sudo docker volume create portainer_data
sudo docker run -d -p 9443:9443 --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
sudo firewall-cmd --permanent --add-port=9443/tcp
sudo firewall-cmd --reload
```
Then from *any* browser, anywhere — phone, laptop, doesn't matter —
visit `https://<vps-ip>:9443`. First visit asks you to create an admin
username/password (this is separate from your VPS login, just for
Portainer itself). After that, log in any time to see every container's
status, live logs, CPU/memory usage, and start/stop/restart buttons — a
real dashboard, no terminal needed for routine checks.

**Security note**: this exposes a login page to the whole internet on port
9443. A strong, unique password for that first-run admin account is the
minimum bar — if your home/office IP is static, you can additionally lock
port 9443 down to just that IP in the firewall
(`firewall-cmd --add-rich-rule='rule family="ipv4" source address="<your-ip>/32" port port="9443" protocol="tcp" accept'`
instead of the plain `--add-port` above) so nobody else can even reach the
login page.

Note this is a completely separate container from Stack's own
`docker compose` stack (`postgres`/`backend`) — it's a host-wide Docker
manager, so it'll also show the elibrary app's containers if that's
Dockerized too, which is expected and fine.

---

## Setting up GitHub Actions — button by button, via the website

This is the one-time setup that makes `git push` alone trigger a deploy.
Everything below is clicking around github.com, no YAML editing needed —
`.github/workflows/deploy.yml` already exists in the repo with the workflow
itself; this just gives it the credentials to log into the VPS.

**On the VPS first** (terminal, as `stackapp`):
```bash
ssh-keygen -t ed25519 -f ~/.ssh/stack_deploy_key -N ""
cat ~/.ssh/stack_deploy_key.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/stack_deploy_key       # print the PRIVATE key — copy this whole
                                    # block, including the BEGIN/END lines
```

**Then on github.com:**
1. Go to your repository's page (`github.com/<you>/<repo>`).
2. Click **Settings** — the tab along the top of the repo, second row of
   tabs, usually the last one on the right. (You need to be the repo owner
   or have admin access to see it.)
3. In the left sidebar, click **Secrets and variables**, then **Actions**
   underneath it.
4. Click the green **New repository secret** button, top right.
5. **Name** field: `VPS_HOST`. **Secret** field: the VPS's IP address (or
   hostname, if you have one pointed at it). Click **Add secret**.
6. Click **New repository secret** again. **Name**: `VPS_USER`. **Secret**:
   `stackapp`. Click **Add secret**.
7. Click **New repository secret** once more. **Name**: `VPS_SSH_KEY`.
   **Secret**: paste the *entire* private key you printed above (the whole
   `-----BEGIN OPENSSH PRIVATE KEY-----` ... `-----END OPENSSH PRIVATE
   KEY-----` block, all of it). Click **Add secret**.
8. You should now see three secrets listed: `VPS_HOST`, `VPS_USER`,
   `VPS_SSH_KEY`. (Their values are never shown again after saving — that's
   normal, GitHub only lets you overwrite, not view, a secret once set.)

**Test it without waiting for a real code change:**
9. Click the **Actions** tab (top of the repo, next to Settings).
10. In the left sidebar, click **Deploy** (the workflow name from
    `deploy.yml`'s `name:` field).
11. Click the **Run workflow** dropdown button on the right, make sure
    `main` is selected, click the green **Run workflow** button inside the
    dropdown.
12. Refresh after a few seconds — a new run appears in the list. Click into
    it to watch it SSH in and deploy live, and to see exactly what failed
    if it doesn't go green.

From here on: **`git push` to `main` is the deploy.**

---

## Future updates — what a routine code change looks like

Once the GitHub Actions secrets above are set up, the day-to-day loop is:

1. Edit code locally, same as any session with Claude or on your own.
2. Test locally (backend tests, PWA build, manual pass through the tunnel
   if it's something worth phone-testing before it's live).
3. `git commit`, `git push` to `main`.
4. GitHub Actions automatically SSHes into the VPS and runs:
   `git pull` → `docker compose up -d --build` (rebuilds the backend
   container only if backend code changed — Docker caches unchanged
   layers) → `cd PWA && npm ci && npm run build` (rebuilds the static PWA
   files) → done. No manual SSH needed for routine changes.

**Things that still need a manual step**, because they're not "just push
and it happens":
- **Changing env vars** (`backend/.env`, root `.env`) — edit the file
  directly on the VPS over SSH, then `docker compose up -d` to pick it up
  (`git pull` never touches `.env` files, they're gitignored on purpose).
- **A new nginx location block or manifest change that needs SELinux
  context on a new path** — one-off `semanage`/`restorecon` command, same
  as the initial setup.

---

## One GitHub repo for frontend + backend + website + PWA — is that fine?

Yes, keep it as one repo for now. Splitting into multiple repos mainly
pays off when different pieces are deployed independently by different
teams/pipelines with genuinely different release cadences — not the case
here, everything ships together and one person (you) is driving all of
it. A monorepo also makes exactly the kind of session we just had (backend
+ PWA changed together, atomically, in one commit) simpler, not harder.

The one live open question from earlier this session: whether to retire
`website/` now that `PWA/` is a strict superset of it (same features, plus
push/voice/native-feel polish it never had). Worth deciding before or
shortly after tonight's deploy, since maintaining two near-duplicate
frontends forever is wasted effort either way — not a repo-structure
question, just a "delete the redundant folder" one.
