import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// vite-plugin-pwa's injectManifest strategy replaces this at build time with
// the actual list of built asset URLs to precache — this is why the build
// (not dev) is what the manifest injection targets. Custom service worker,
// not the default generateSW one, purely because Push needs to be handled
// by hand below — generateSW has no hook for that.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// API calls: try the network first (freshest data), fall back to whatever
// was last cached if offline — never cache-first, since stale task state is
// actively wrong, not just outdated.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'stack-api', networkTimeoutSeconds: 4 })
);

// Avatars/group photos change rarely once uploaded — cache-first is safe
// and keeps the dashboard feeling instant on a slow connection.
registerRoute(
  ({ url }) => url.pathname.startsWith('/media/'),
  new CacheFirst({ cacheName: 'stack-media' })
);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// --- Web Push ---------------------------------------------------------
//
// Mirrors what the mobile app's Expo push notifications do for group
// invites/nudges (see backend/family/push.py's send_expo_push and the
// parallel send_web_push in backend/accounts/webpush.py) — this is the
// browser-side half: render the notification, and route a tap on it to the
// right screen inside the app instead of just opening the homepage.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Stack', body: event.data.text() };
  }

  const { title, body, data } = payload;
  event.waitUntil(
    self.registration.showNotification(title || 'Stack', {
      body,
      // `icon` is the larger, full-color image shown in the notification
      // body — the actual app icon. `badge` is the small monochrome glyph
      // some platforms (Android's status bar, in particular) render tinted
      // to a single color instead — favicon.png is the closer fit there
      // since it's the plainer, smaller mark rather than the full icon.
      icon: '/icon-192.png',
      badge: '/favicon.png',
      data: data || {},
      tag: data?.inviteId ? `invite-${data.inviteId}` : data?.stackId ? `stack-${data.stackId}` : undefined,
    })
  );
});

// Deep-link on tap, same routing logic as App.js's notification-response
// handler on mobile: an invite notification opens the Group Stacks hub
// (where the pending-invite accept/decline UI lives), a nudge notification
// opens straight into that stack.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  // `inviteId` (see backend/family/views.py's InviteToGroupStackView) only
  // ever accompanies an invite push, never a nudge — used here instead of
  // just checking `stackId` alone, which both payloads carry. Routing an
  // invite straight to `/stacks/:stackId` was the actual bug behind
  // "Couldn't load this stack": the invitee hasn't accepted yet, isn't a
  // member, and GroupStackDetail's fetch of that stack's tasks legitimately
  // fails for a non-member. The hub is where the accept/decline UI lives.
  const path = data.inviteId ? '/stacks' : data.stackId ? `/stacks/${data.stackId}` : '/stacks';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(path);
          return client.focus();
        }
      }
      return self.clients.openWindow(path);
    })
  );
});
