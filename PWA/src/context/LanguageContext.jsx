import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { languages, DEFAULT_LANGUAGE } from '../languages';
import { resources } from '../i18n';

const LANG_KEY = 'stack_language';

const LanguageContext = createContext(null);

// Same "write derived state onto document.documentElement" trick as
// ThemeContext's applyCssVars/applyThemeColorMeta — `lang`/`dir` need to be
// on <html> (not some inner wrapper) for the browser's own RTL layout,
// spellcheck, and font-selection behavior to kick in, and `dataset.lang`
// mirrors ThemeContext's `dataset.mode` so index.css can key the Arabic/Urdu
// font-family swap off a plain CSS attribute selector.
function applyDocumentLanguage(lang) {
  const meta = languages.find((l) => l.id === lang) || languages[0];
  document.documentElement.lang = meta.id;
  document.documentElement.dir = meta.dir;
  document.documentElement.dataset.lang = meta.id;
}

function lookup(dict, path) {
  return path.split('.').reduce((node, key) => (node && typeof node === 'object' ? node[key] : undefined), dict);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(LANG_KEY);
    return languages.some((l) => l.id === stored) ? stored : DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((id) => {
    if (!languages.some((l) => l.id === id)) return;
    setLanguageState(id);
    localStorage.setItem(LANG_KEY, id);
  }, []);

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  const meta = languages.find((l) => l.id === language) || languages[0];

  // Falls back English -> raw key (never a blank UI, and a missing
  // translation is visible/greppable in the rendered page instead of
  // silently disappearing) rather than throwing, since a page shouldn't
  // hard-crash over one missing string in an in-progress locale.
  const t = useCallback(
    (key, vars) => {
      let str = lookup(resources[language], key);
      if (str === undefined) str = lookup(resources[DEFAULT_LANGUAGE], key);
      if (str === undefined) return key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{{${k}}}`, v);
        }
      }
      return str;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, dir: meta.dir, t, languages }),
    [language, setLanguage, meta.dir, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
