// Whether this tab is running as an installed, standalone PWA rather than a
// normal browser tab — `display-mode: standalone` is what Chrome/Edge (and
// Android's WebAPK wrapper) set; `navigator.standalone` is Safari's older,
// iOS-only equivalent signal for the same thing.
export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
