import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { themeFamilies, themes } from '../theme';

const MODE_STORAGE_KEY = 'stack_theme_preference';
const FAMILY_STORAGE_KEY = 'stack_theme_family';
const ThemeContext = createContext(null);

// Three preferences, not two: 'system' follows the OS light/dark setting
// (and reacts live if it changes, e.g. a scheduled dark mode kicking in),
// while 'dawn'/'dusk' are explicit overrides that always win over the OS.
// The toggle button cycles through all three, in this order. Despite the
// names, these select LIGHT/DARK MODE only, independent of which color
// family (see below) is active — 'dawn' always means "light mode," 'dusk'
// always means "dark mode," in whichever family is currently selected.
const PREFERENCE_ORDER = ['system', 'dawn', 'dusk'];

const DEFAULT_FAMILY = 'classic';

export function ThemeProvider({ children }) {
  // React Native's own hook — no extra dependency, and it re-renders this
  // provider whenever the OS setting changes while the app is open/foregrounded,
  // which is what makes 'system' preference live instead of "correct only
  // on next app launch."
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState('system');
  // Which color FAMILY (classic/purple/forest/alpine) is active — separate
  // from the light/dark mode above. All families are free for every account.
  const [familyId, setFamilyIdState] = useState(DEFAULT_FAMILY);

  useEffect(() => {
    SecureStore.getItemAsync(MODE_STORAGE_KEY).then((stored) => {
      if (stored && PREFERENCE_ORDER.includes(stored)) setPreferenceState(stored);
    });
    SecureStore.getItemAsync(FAMILY_STORAGE_KEY).then((stored) => {
      if (stored && themeFamilies.some((f) => f.id === stored)) setFamilyIdState(stored);
    });
  }, []);

  const setPreference = useCallback((name) => {
    if (!PREFERENCE_ORDER.includes(name)) return;
    setPreferenceState(name);
    SecureStore.setItemAsync(MODE_STORAGE_KEY, name);
  }, []);

  const setThemeFamily = useCallback((id) => {
    if (!themeFamilies.some((f) => f.id === id)) return;
    setFamilyIdState(id);
    SecureStore.setItemAsync(FAMILY_STORAGE_KEY, id);
  }, []);

  // An explicit dawn/dusk choice always wins; 'system' resolves to
  // whichever mode matches the OS right now. `systemScheme` can briefly be
  // null before the native module reports in, so that falls back to light
  // mode rather than an undefined theme.
  const isSystemTheme = preference === 'system';
  const mode = isSystemTheme ? (systemScheme === 'dark' ? 'dusk' : 'dawn') : preference;

  const family = themeFamilies.find((f) => f.id === familyId) || themeFamilies[0];
  const themeKey = mode === 'dusk' ? family.dark : family.light;
  const themeName = themeKey;

  const toggleTheme = useCallback(() => {
    const currentIndex = PREFERENCE_ORDER.indexOf(preference);
    const next = PREFERENCE_ORDER[(currentIndex + 1) % PREFERENCE_ORDER.length];
    setPreference(next);
  }, [preference, setPreference]);

  const value = useMemo(
    () => ({
      themeName,
      theme: themes[themeName],
      themePreference: preference,
      isSystemTheme,
      toggleTheme,
      themeFamily: family.id,
      setThemeFamily,
    }),
    [themeName, preference, isSystemTheme, toggleTheme, family.id, setThemeFamily]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
