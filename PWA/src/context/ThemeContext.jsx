import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { themeFamilies, themes } from '../theme';

const MODE_KEY = 'stack_theme_preference';
const FAMILY_KEY = 'stack_theme_family';
const PREFERENCE_ORDER = ['system', 'dawn', 'dusk'];
const DEFAULT_FAMILY = 'classic';

const ThemeContext = createContext(null);

// Writes the active palette onto :root as CSS custom properties, so any
// page's plain CSS file can read `var(--color-accent)` etc. without every
// component needing to reach into the theme object in JS. Components that
// DO need the raw value (icon `color` props, inline gradients) can still
// pull it from `theme` via useTheme().
function applyCssVars(theme) {
  const root = document.documentElement.style;
  root.setProperty('--gradient-1', theme.gradient[0]);
  root.setProperty('--gradient-2', theme.gradient[1]);
  root.setProperty('--gradient-3', theme.gradient[2]);
  root.setProperty('--color-card', theme.card);
  root.setProperty('--color-card-border', theme.cardBorder);
  root.setProperty('--color-card-elevated', theme.cardElevated);
  root.setProperty('--color-text', theme.text);
  root.setProperty('--color-text-muted', theme.textMuted);
  root.setProperty('--color-accent', theme.accent);
  root.setProperty('--color-accent-soft', theme.accentSoft);
  root.setProperty('--color-on-accent', theme.onAccent);
  root.setProperty('--color-danger', theme.danger);
  root.setProperty('--color-success', theme.success);
  root.setProperty('--color-shadow', theme.shadow);
  root.setProperty('--color-overlay', theme.overlay);
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(
    () => localStorage.getItem(MODE_KEY) || 'system'
  );
  const [familyId, setFamilyIdState] = useState(
    () => localStorage.getItem(FAMILY_KEY) || DEFAULT_FAMILY
  );
  const [systemIsDark, setSystemIsDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemIsDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const setPreference = useCallback((name) => {
    if (!PREFERENCE_ORDER.includes(name)) return;
    setPreferenceState(name);
    localStorage.setItem(MODE_KEY, name);
  }, []);

  const setThemeFamily = useCallback((id) => {
    if (!themeFamilies.some((f) => f.id === id)) return;
    setFamilyIdState(id);
    localStorage.setItem(FAMILY_KEY, id);
  }, []);

  const isSystemTheme = preference === 'system';
  const mode = isSystemTheme ? (systemIsDark ? 'dusk' : 'dawn') : preference;
  const family = themeFamilies.find((f) => f.id === familyId) || themeFamilies[0];
  const themeName = mode === 'dusk' ? family.dark : family.light;
  const theme = themes[themeName];

  useEffect(() => {
    applyCssVars(theme);
    document.documentElement.dataset.mode = mode;
  }, [theme, mode]);

  const toggleTheme = useCallback(() => {
    const idx = PREFERENCE_ORDER.indexOf(preference);
    setPreference(PREFERENCE_ORDER[(idx + 1) % PREFERENCE_ORDER.length]);
  }, [preference, setPreference]);

  const value = useMemo(
    () => ({
      theme,
      themeName,
      mode,
      themePreference: preference,
      isSystemTheme,
      toggleTheme,
      themeFamily: family.id,
      setThemeFamily,
    }),
    [theme, themeName, mode, preference, isSystemTheme, toggleTheme, family.id, setThemeFamily]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
