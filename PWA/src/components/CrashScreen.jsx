import { RefreshCw } from 'lucide-react';
import { resources } from '../i18n';
import { languages, DEFAULT_LANGUAGE } from '../languages';

// Reads the language preference straight out of localStorage instead of
// useLanguage() — this screen renders when something ABOVE it in the tree
// (including LanguageProvider itself, since that's inside App.jsx) has
// already crashed and been unmounted by Sentry's ErrorBoundary. Calling a
// context hook here would just throw a second error ("must be used within a
// LanguageProvider") on top of whatever already broke, replacing the
// recovery screen with the exact blank-white-screen failure it exists to
// prevent. Plain data lookup has no such dependency.
function crashScreenText() {
  let lang = DEFAULT_LANGUAGE;
  try {
    const stored = localStorage.getItem('stack_language');
    if (languages.some((l) => l.id === stored)) lang = stored;
  } catch {
    // localStorage itself can throw in some locked-down/private-mode
    // states — falls back to DEFAULT_LANGUAGE either way.
  }
  const dict = resources[lang]?.common?.crashScreen || resources[DEFAULT_LANGUAGE].common.crashScreen;
  const dir = languages.find((l) => l.id === lang)?.dir || 'ltr';
  return { ...dict, dir };
}

// What renders instead of a blank white screen if something genuinely
// crashes React's render tree — see main.jsx's Sentry.ErrorBoundary. Sentry
// has already captured the error (if VITE_SENTRY_DSN is set) by the time
// this shows; this is purely the human-facing recovery, not the reporting.
export default function CrashScreen({ resetError }) {
  const text = crashScreenText();
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
        direction: text.dir,
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{text.title}</p>
      <p style={{ fontSize: 14, opacity: 0.8, margin: 0, maxWidth: 320 }}>{text.body}</p>
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
        {text.button}
      </button>
    </div>
  );
}
