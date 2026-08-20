// Ported alongside theme.js's `themes`/`themeFamilies` data-table pattern —
// plain data, no component logic, so LanguageContext and LanguagePicker can
// both just import and map over it.
export const languages = [
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
    dir: 'ltr',
    flag: 'GB',
  },
  {
    id: 'ar',
    label: 'Arabic',
    nativeLabel: 'العربية',
    dir: 'rtl',
    flag: 'SA',
  },
  {
    id: 'ur',
    label: 'Urdu',
    nativeLabel: 'اردو',
    dir: 'rtl',
    flag: 'PK',
  },
];

export const DEFAULT_LANGUAGE = 'en';
