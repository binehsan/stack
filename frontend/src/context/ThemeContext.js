import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { themes } from '../theme';

const STORAGE_KEY = 'stack_theme_preference';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeNameState] = useState('dawn');

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored && themes[stored]) setThemeNameState(stored);
    });
  }, []);

  const setThemeName = useCallback((name) => {
    if (!themes[name]) return;
    setThemeNameState(name);
    SecureStore.setItemAsync(STORAGE_KEY, name);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeName(themeName === 'dawn' ? 'dusk' : 'dawn');
  }, [themeName, setThemeName]);

  const value = useMemo(
    () => ({ themeName, theme: themes[themeName], setThemeName, toggleTheme }),
    [themeName, setThemeName, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
