import { RefreshCw } from 'lucide-react';

// What renders instead of a blank white screen if something genuinely
// crashes React's render tree — see main.jsx's Sentry.ErrorBoundary. Sentry
// has already captured the error (if VITE_SENTRY_DSN is set) by the time
// this shows; this is purely the human-facing recovery, not the reporting.
export default function CrashScreen({ resetError }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        background: '#583714',
        color: '#FFFDF7',
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Something went wrong</p>
      <p style={{ fontSize: 14, opacity: 0.8, margin: 0, maxWidth: 320 }}>
        Stack hit an unexpected error. Your tasks are safe — this is just a display issue.
      </p>
      <button
        type="button"
        onClick={() => {
          resetError();
          window.location.href = '/dashboard';
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#A8551C',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <RefreshCw size={15} strokeWidth={2.5} />
        Reload Stack
      </button>
    </div>
  );
}
