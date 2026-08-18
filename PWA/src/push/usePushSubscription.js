import { useCallback, useEffect, useState } from 'react';

import { request } from '../api/client';

// Set at build time from backend/.env's VAPID_PUBLIC_KEY (see
// backend/config/settings.py's Web Push section) — safe to expose, it's
// the public half of the keypair, same trust model as any other public key.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// The Push API wants the VAPID key as a raw Uint8Array, not the
// base64url string it's normally handed around as — this is the standard
// conversion every Web Push tutorial reaches for.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Drives the "Notifications: On/Off" toggle in Settings. Mirrors the shape
// of a typical auth-style hook (loading/error/action-functions) so it slots
// into the page the same way useAuth/useTheme do.
export function usePushSubscription() {
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(VAPID_PUBLIC_KEY);

  const [permission, setPermission] = useState(
    supported ? Notification.permission : 'unsupported'
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => setSubscribed(Boolean(existing)))
      .catch(() => setSubscribed(false));
  }, [supported]);

  const subscribe = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        throw new Error('Notification permission was not granted.');
      }

      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await request('/auth/web-push-subscribe/', {
        method: 'POST',
        body: JSON.stringify(pushSubscription.toJSON()),
      });
      setSubscribed(true);
    } catch (err) {
      setError(err.message || 'Could not enable notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      if (pushSubscription) {
        await request('/auth/web-push-unsubscribe/', {
          method: 'POST',
          body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
        });
        await pushSubscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err.message || 'Could not disable notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, permission, subscribed, loading, error, subscribe, unsubscribe };
}
