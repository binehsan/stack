import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Shared by both server.proxy and preview.proxy below — forwards to Django
// and, critically, tells it the *real* public-facing host/scheme via
// X-Forwarded-* headers (xfwd), which request.build_absolute_uri() then uses
// (see backend/config/settings.py's USE_X_FORWARDED_HOST) to generate
// avatar/group-photo URLs that actually resolve from a phone on the other
// side of a tunnel, instead of baking in "localhost:8000". X-Forwarded-Proto
// is force-set to https rather than left to xfwd's own detection: xfwd infers
// it from whether *this* connection (tunnel -> Vite) is encrypted, which it
// isn't — cloudflared/ngrok terminate TLS themselves and forward plain HTTP
// locally — so xfwd alone would report "http" even though the tunnel's
// public URL is https. Hardcoding it here is fine since this dev proxy is
// only ever reached through an HTTPS tunnel or eventually production HTTPS;
// it never matters for the plain-LAN-IP quick-check flow (that one has no
// use for correct absolute URLs anyway, since it can't test installed-app
// behavior at all).
function backendProxy() {
  return {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      xfwd: true,
      configure(proxy) {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('X-Forwarded-Proto', 'https')
        })
      },
    },
    // Avatars and group-stack photos live here — without this route, the
    // (now-correct) relative-to-this-origin image URLs 404 instead of
    // reaching Django's media serving.
    '/media': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Makes this a real, installable app on iOS/Android/desktop alike — a
    // web manifest + service worker so every platform offers an "Install"/
    // "Add to Home Screen" affordance that launches Stack as a standalone
    // window with no browser chrome. `injectManifest` (not the default
    // `generateSW`) points at our own src/sw.js, since Web Push needs a
    // hand-written `push`/`notificationclick` handler — generateSW has no
    // hook for that, it only knows how to precache. Colors below are the
    // same tokens src/index.css defines (`--gradient-3` / `--gradient-1`),
    // not guesses.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        // Keep the precached app-shell small — big images (avatars, group
        // photos) are handled by sw.js's own CacheFirst route instead of
        // being precached upfront.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Stack',
        short_name: 'Stack',
        description: 'Your tasks, together.',
        display: 'standalone',
        start_url: '/dashboard',
        theme_color: '#583714',
        background_color: '#583714',
        // Shows up in Android's app-category filtering and some install
        // surfaces — harmless to include, and free once you know the field
        // exists.
        categories: ['productivity', 'lifestyle'],
        // Plain square art, 'any' purpose only. A 'maskable' icon was tried
        // here (padded into the inner 62% of the canvas for Android's
        // adaptive-icon shapes) but Android launchers that support adaptive
        // icons prefer a maskable icon when present and apply their own
        // background/shape treatment to it — which made the icon look
        // smaller (the deliberate safe-zone padding) with a launcher-filled
        // background showing around the logo instead of the original
        // edge-to-edge art. Reverted to 'any'-only so Android falls back to
        // the plain square icon with no adaptive shaping applied.
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        // Registers Stack as a Share Target — Android's real equivalent of
        // "add a button to the copy/paste popup" (that specific in-place
        // menu is off-limits to web apps, only native apps can hook into it
        // via ACTION_PROCESS_TEXT). This instead adds Stack to the OS Share
        // sheet, reachable by selecting text in *any* app and tapping
        // Share, or by an app's own "Share" action — broader than a
        // context-menu entry, since it works from anywhere, not just text
        // selections. GET + query params (not POST) since there's no file
        // payload to handle, which means no service-worker fetch handler is
        // needed — see src/pages/ShareTarget.jsx for the receiving end.
        // iOS Safari doesn't implement share_target at all; this is
        // Android/desktop-Chrome only, and simply won't show up as a share
        // option on iOS.
        share_target: {
          action: '/share-target',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        // Long-press the home-screen icon (Android) or right-click the
        // taskbar/dock icon (desktop) to jump straight to an already-
        // focused add-task box — no extra route/page needed since
        // TaskInput already autofocuses on mount.
        shortcuts: [
          {
            name: 'Add Task',
            short_name: 'Add Task',
            url: '/dashboard',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Group Stacks',
            short_name: 'Groups',
            url: '/stacks',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    // Binds to 0.0.0.0, not just localhost, so a phone on the same Wi-Fi
    // (or a tunnel like ngrok pointed at this machine) can actually reach
    // the dev server — same reason the mobile app's config.js needs your
    // LAN IP instead of "localhost". allowedHosts disables Vite's Host-header
    // allowlist (a DNS-rebinding protection that otherwise rejects requests
    // arriving via a tunnel's *.ngrok-free.app / *.loca.lt hostname) — fine
    // to leave wide open for local dev, tighten if this ever ran non-locally.
    host: true,
    allowedHosts: true,
    // Lets the web app call fetch('/api/...') in dev without hardcoding a
    // host/port — mirrors how the mobile app points at the Django backend,
    // but avoids baking a LAN IP into the web build. Production deploys
    // set VITE_API_BASE_URL instead (see src/api/config.js).
    proxy: backendProxy(),
  },
  // `vite preview` serves the real production build (dist/) — the only way
  // to actually test installability/push, since vite-plugin-pwa doesn't
  // generate a working service worker under plain `vite dev`. Mirrors
  // server's host/allowedHosts/proxy so `npm run build && npm run preview`
  // is just as tunnel-and-phone-friendly as dev was.
  preview: {
    port: 4173,
    host: true,
    allowedHosts: true,
    proxy: backendProxy(),
  },
})
