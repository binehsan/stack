import * as Sentry from '@sentry/react';

// No-ops entirely if VITE_SENTRY_DSN isn't set — safe to leave this call in
// place in every environment, including local dev where you generally don't
// want your own testing traffic showing up in production error reports.
// Get a DSN by creating a free project at sentry.io (Platform: React), then
// set VITE_SENTRY_DSN in PWA/.env to the value it gives you.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Session Replay is off by default (extra script weight + a privacy
    // consideration — it can capture screen content) — traces alone
    // (performance + error context) are enough to start with. Add
    // Sentry.replayIntegration() to the list below later if you want it.
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  });
}
