// Central place for the app's visual language. `radii`/`spacing`/`typography`
// are shared across themes; `themes` holds the color palettes a user can
// switch between (see src/theme/ThemeContext.js) — same shapes/spacing/type
// rhythm either way, so switching themes never feels like a different app.
export const themes = {
  dawn: {
    label: 'Dawn',
    statusBarStyle: 'dark',
    gradient: ['#FDF4FF', '#EDE9FE', '#E0F2FE'],
    card: 'rgba(255, 255, 255, 0.85)',
    cardBorder: 'rgba(255, 255, 255, 0.6)',
    cardElevated: 'rgba(255, 255, 255, 0.95)',
    text: '#241E30',
    textMuted: '#8A8398',
    accent: '#7C5CFC',
    accentSoft: 'rgba(124, 92, 252, 0.12)',
    danger: '#F56565',
    success: '#2FAE6B',
    shadow: '#000000',
    overlay: 'rgba(36, 30, 48, 0.45)',
  },
  dusk: {
    label: 'Dusk',
    statusBarStyle: 'light',
    gradient: ['#1B1730', '#241E3D', '#171A2E'],
    card: 'rgba(255, 255, 255, 0.07)',
    cardBorder: 'rgba(255, 255, 255, 0.14)',
    cardElevated: 'rgba(255, 255, 255, 0.12)',
    text: '#F3EFFA',
    textMuted: '#A9A2BE',
    accent: '#B29CFF',
    accentSoft: 'rgba(178, 156, 255, 0.18)',
    danger: '#FF7A7A',
    success: '#5FE38C',
    shadow: '#000000',
    overlay: 'rgba(5, 4, 12, 0.6)',
  },
};

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// One clean sans-serif via the system font stack (per requirements.md),
// with a clear size/weight hierarchy so headers, titles, body, and
// secondary text all read as distinct levels at a glance.
export const typography = {
  header: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 19, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  bodyStrong: { fontSize: 16, fontWeight: '600' },
  small: { fontSize: 14, fontWeight: '500' },
  tiny: { fontSize: 12, fontWeight: '600' },
};
