import { useCallback, useEffect, useState } from 'react';

import { isStandalonePwa } from '../pwaMode';

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iP(hone|od|ad)/.test(navigator.platform) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}

// Wraps Chrome/Edge's `beforeinstallprompt` — the browser fires this once
// its own install heuristics are satisfied (HTTPS, valid manifest, a little
// engagement) and, left alone, only ever surfaces as a small icon in the
// address bar. Capturing it lets an in-page "Install" button trigger the
// exact same native prompt on demand instead of relying on someone noticing
// that icon. iOS Safari never fires this event — there is no programmatic
// install API on iOS at all, by Apple's own design — so `canPromptInstall`
// stays false there forever and callers should fall back to a guided
// Share-sheet walkthrough instead.
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalonePwa());

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredEvent(event);
    }
    function handleInstalled() {
      setInstalled(true);
      setDeferredEvent(null);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return null;
    deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    // Chrome only ever lets a captured prompt fire once — a fresh
    // `beforeinstallprompt` won't arrive again until next page load, so
    // clear it either way rather than leaving a dead reference armed.
    setDeferredEvent(null);
    return outcome;
  }, [deferredEvent]);

  return {
    canPromptInstall: Boolean(deferredEvent),
    isIOS: isIOSDevice(),
    installed,
    promptInstall,
  };
}
