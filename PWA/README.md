# Stack — PWA

The installable, full-feature Progressive Web App version of Stack — built
on top of `website/`'s existing React + Vite foundation (same components,
same Django backend under `backend/`), extended to reach real feature
parity with the native mobile app and to feel like an installed app rather
than a website.

Not a rewrite: this folder started as a straight copy of `website/`, then
added what the plain website didn't have — voice input, push notifications,
recap/carry-forward/streaks, and a set of CSS/manifest changes aimed
specifically at making an installed instance stop feeling like a browser
tab. See the "What's different from `website/`" section below for the
exact diff in intent.

## Setup

From this directory:

```bash
npm install
cp .env.example .env
npm run dev
```

Needs the Django backend running too (`backend/`, `python manage.py
runserver 0.0.0.0:8000`) — `vite.config.js`'s dev proxy forwards `/api` to
`localhost:8000` automatically, so `.env` can stay empty for local dev.

### Enabling push notifications locally

Push notifications need a VAPID keypair (the credentials that let your
backend prove to browsers' push services that pushes are actually coming
from you). Generate one:

```bash
npx web-push generate-vapid-keys
```

Then set the **public** key in two places (same value, both places):
- `PWA/.env` → `VITE_VAPID_PUBLIC_KEY`
- `backend/.env` → `VAPID_PUBLIC_KEY`

And the **private** key in one place only, never committed:
- `backend/.env` → `VAPID_PRIVATE_KEY`

Also set `backend/.env`'s `VAPID_CLAIMS_EMAIL` to a real contact address —
push services want this to reach you if your server is misbehaving.
Without a private key set, `accounts/webpush.py`'s `send_web_push` just
no-ops instead of crashing, so everything else works fine without it.

**Push notifications require HTTPS** (or `localhost`, which browsers treat
as a secure context) — `npm run dev`'s `localhost:5173` works fine for
testing this locally; a LAN IP won't.

## What's different from `website/`

`website/` is the plain marketing site + paid-web-app pattern this was
forked from. This folder adds:

- **Voice input** (`src/voice/useVoiceInput.js`) — Web Speech API, wired
  into `TaskInput`. Feature-detects and gracefully disables itself on an
  installed iOS PWA specifically, since Safari's SpeechRecognition
  constructor exists there but never actually returns a result once
  installed to the home screen (it works fine in a normal Safari tab —
  this is a real WebKit limitation, not a bug in this code). iOS users
  still get voice input if they open the site in Safari directly instead
  of the installed app.
- **Push notifications** (`src/push/`, `src/sw.js`, `backend/accounts/webpush.py`,
  `backend/accounts/models.py`'s `WebPushSubscription`) — Web Push/VAPID,
  parallel to the mobile app's Expo push for the same two events (group
  invites, nudges). Requires a custom service worker (`src/sw.js`,
  registered via `vite-plugin-pwa`'s `injectManifest` strategy instead of
  the simpler `generateSW` one) since push handling needs code, not just a
  precache list.
- **Home-screen badge** (`src/push/badge.js`) — shows a pending-invite
  count on the installed icon via the Badging API, supported on both iOS
  16.4+ and Android Chrome/Edge.
- **Recap, carry-forward, and stats/streaks** (`src/components/dashboard/RecapModal.jsx`,
  `CarryForwardModal.jsx`, `src/components/StatTile.jsx`, wired into
  `Dashboard.jsx` and `Settings.jsx`) — `website/`'s `api/tasks.js` already
  had the API calls for these; only the UI was missing.
- **Native-feel CSS/manifest** (`index.html`, `src/index.css`,
  `vite.config.js`) — `overscroll-behavior: none` to kill the browser's
  rubber-band bounce, safe-area insets so content clears the iOS
  notch/home-indicator, `touch-action: manipulation` + disabled
  long-press callouts so it doesn't read as a webpage, iOS-specific
  `apple-mobile-web-app-*` meta tags for true standalone launch.

## Known, permanent gaps vs. native (platform limitations, not bugs)

- **No native edge-swipe-back gesture on iOS** — not implementable in a
  PWA; browser back-navigation only.
- **No haptics on iOS Safari** — `navigator.vibrate()` only works on
  Android Chrome.
- **No install prompt on iOS** — users have to manually go Safari → Share
  → Add to Home Screen; there's no `beforeinstallprompt` equivalent there.
- **Push notifications are disabled entirely for users physically in the
  EU** on iOS 17.4+ (a side effect of Apple's DMA compliance changes) —
  unaffected outside the EU, and unaffected on Android everywhere.

## Deploying

Same shape as `website/` — `npm run build` produces `dist/`, served by
Caddy per `docker-compose.yml`/`deploy/caddy/Caddyfile`. If this PWA
replaces `website/` in production rather than running alongside it, update
`docker-compose.yml`'s frontend build context and the Caddyfile's static
root to point here instead.
