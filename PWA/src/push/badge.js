// The Badging API — shipped alongside Web Push in iOS 16.4, and supported
// on Android Chrome/Edge too — shows an unread-count badge on the app's
// home-screen icon, same as a native app. Feature-detected: unsupported
// browsers (Firefox, plain desktop tabs) just no-op silently.
export function setBadgeCount(count) {
  if (!('setAppBadge' in navigator)) return;
  if (count > 0) {
    navigator.setAppBadge(count).catch(() => {});
  } else if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge().catch(() => {});
  }
}
