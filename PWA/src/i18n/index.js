import en from './locales/en';
import ar from './locales/ar';
import ur from './locales/ur';

// Consumed by LanguageContext's `t()` (dot-path lookup with English
// fallback) and by CrashScreen.jsx directly (it renders outside the
// provider tree when Sentry's boundary has already unmounted everything
// above it, so it can't call useLanguage() — it reads this + localStorage
// itself instead).
export const resources = { en, ar, ur };
