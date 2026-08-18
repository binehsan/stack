// Central place for the app's visual language. `radii`/`spacing`/`typography`
// are shared across themes; `themes` holds the color palettes a user can
// switch between (see src/theme/ThemeContext.js) — same shapes/spacing/type
// rhythm either way, so switching themes never feels like a different app.
export const themes = {
  // Warm gold-to-mocha gradient (#FFEB97 → #583714) — a sunset-in-a-mug
  // palette instead of the old cool purple, carried through every derived
  // color (accent, card tint, overlay) so the whole app reads as one warm
  // family rather than a gradient pasted over an unrelated color scheme.
  dawn: {
    label: 'Dawn',
    statusBarStyle: 'dark',
    gradient: ['#FFEB97', '#E7B768', '#583714'],
    card: 'rgba(255, 250, 235, 0.82)',
    cardBorder: 'rgba(88, 55, 20, 0.14)',
    // Near-opaque, deliberately more solid than `card` — used by modals
    // (Recap, Carry-forward, Nudge) that need to read clearly over the
    // busier animated background, not blend into it.
    cardElevated: 'rgba(255, 253, 247, 0.98)',
    text: '#3A2413',
    // Darker than the original #8A6A45 — that read fine on cards but too
    // low-contrast for text sitting directly on the pale top of the
    // gradient (e.g. "Already have an account?" below the login card).
    textMuted: '#6B4A28',
    accent: '#A8551C',
    accentSoft: 'rgba(168, 85, 28, 0.12)',
    // Text/icon color to use on TOP of a solid `accent` background (e.g.
    // PrimaryButton). Not always white — dusk's accent is a bright gold
    // that white text can't sit on legibly, so this is themed too.
    onAccent: '#FFFFFF',
    danger: '#D64545',
    success: '#3E8F5D',
    shadow: '#2A1808',
    overlay: 'rgba(58, 36, 19, 0.32)',
  },
  dusk: {
    label: 'Dusk',
    statusBarStyle: 'light',
    gradient: ['#583714', '#3B2410', '#1C1108'],
    card: 'rgba(255, 235, 151, 0.07)',
    cardBorder: 'rgba(255, 235, 151, 0.16)',
    // A solid dark-brown surface, not a low-alpha tint like `card` — at
    // 0.12 this used to be barely distinguishable from the gradient behind
    // it, which made modals (Recap, Carry-forward, Nudge) look see-through
    // instead of like an elevated card.
    cardElevated: 'rgba(43, 26, 12, 0.97)',
    text: '#FBEFD9',
    textMuted: '#D8B98C',
    accent: '#FFC15E',
    accentSoft: 'rgba(255, 193, 94, 0.18)',
    // Dark, not white — dusk's accent is a bright gold, and white text on
    // top of a bright color is nearly as illegible as white-on-white.
    onAccent: '#2B1A0C',
    // A medium, saturated red rather than the original pale #FF8686 —
    // that read fine as small error text on a dark card, but the same
    // color is also used as a SOLID BUTTON background with white text on
    // top (delete/swipe actions), and white-on-pale-coral has poor
    // contrast. This value works for both roles.
    danger: '#E5484D',
    success: '#6FDB93',
    shadow: '#000000',
    overlay: 'rgba(10, 6, 3, 0.5)',
  },
  // Extra free color-family palettes (see themeFamilies below) — same field shapes as
  // dawn/dusk above, tuned the same way: light stops kept clearly tinted
  // (never near-white) so Logo.js's fixed white ring still reads as a
  // distinct edge rather than blending in, and text/textMuted/accent
  // contrast-checked against their own card/gradient the same way dawn's
  // comments describe.
  purpleDawn: {
    label: 'Premium Purple',
    statusBarStyle: 'dark',
    gradient: ['#DCB8FF', '#A868D9', '#3D1F5C'],
    card: 'rgba(250, 244, 255, 0.82)',
    cardBorder: 'rgba(74, 42, 107, 0.14)',
    cardElevated: 'rgba(253, 250, 255, 0.98)',
    text: '#3A1F52',
    textMuted: '#6B4C87',
    accent: '#7C3AED',
    accentSoft: 'rgba(124, 58, 237, 0.12)',
    onAccent: '#FFFFFF',
    danger: '#D64545',
    success: '#3E8F5D',
    shadow: '#2A1030',
    overlay: 'rgba(42, 16, 48, 0.32)',
  },
  purpleDusk: {
    label: 'Premium Purple',
    statusBarStyle: 'light',
    gradient: ['#4C2A72', '#2E1747', '#140A1F'],
    card: 'rgba(233, 213, 255, 0.07)',
    cardBorder: 'rgba(233, 213, 255, 0.16)',
    cardElevated: 'rgba(36, 20, 50, 0.97)',
    text: '#F0E3FF',
    textMuted: '#C9A8E0',
    accent: '#B980F0',
    accentSoft: 'rgba(185, 128, 240, 0.18)',
    onAccent: '#241033',
    danger: '#E5484D',
    success: '#6FDB93',
    shadow: '#000000',
    overlay: 'rgba(10, 5, 15, 0.5)',
  },
  forestDawn: {
    label: 'Forest Green',
    statusBarStyle: 'dark',
    gradient: ['#C9E6CE', '#7CB893', '#204D34'],
    card: 'rgba(240, 250, 242, 0.82)',
    cardBorder: 'rgba(31, 107, 69, 0.14)',
    cardElevated: 'rgba(247, 253, 249, 0.98)',
    text: '#153826',
    textMuted: '#3F6B52',
    // Deliberately darker/more desaturated than `success` below — both are
    // green, and if they sat too close in lightness a real "success" state
    // (e.g. the streak banner) would blend into every ordinary accent-
    // colored button instead of reading as a distinct confirmation.
    accent: '#1F6B45',
    accentSoft: 'rgba(31, 107, 69, 0.12)',
    onAccent: '#FFFFFF',
    danger: '#D64545',
    success: '#3E8F5D',
    shadow: '#0C2417',
    overlay: 'rgba(12, 36, 23, 0.32)',
  },
  forestDusk: {
    label: 'Forest Green',
    statusBarStyle: 'light',
    gradient: ['#204D34', '#123322', '#081810'],
    card: 'rgba(180, 230, 197, 0.07)',
    cardBorder: 'rgba(180, 230, 197, 0.16)',
    cardElevated: 'rgba(15, 38, 26, 0.97)',
    text: '#E3F5E7',
    textMuted: '#A8CDB4',
    accent: '#4FCB8A',
    accentSoft: 'rgba(79, 203, 138, 0.18)',
    onAccent: '#0C2417',
    danger: '#E5484D',
    success: '#6FDB93',
    shadow: '#000000',
    overlay: 'rgba(4, 12, 8, 0.5)',
  },
  alpineDawn: {
    label: 'Alpine Blue',
    statusBarStyle: 'dark',
    gradient: ['#C7E3FA', '#5F9EDB', '#173A5E'],
    card: 'rgba(240, 248, 255, 0.82)',
    cardBorder: 'rgba(23, 58, 94, 0.14)',
    cardElevated: 'rgba(247, 251, 255, 0.98)',
    text: '#122A44',
    textMuted: '#3D5C7A',
    accent: '#1C5F9E',
    accentSoft: 'rgba(28, 95, 158, 0.12)',
    onAccent: '#FFFFFF',
    danger: '#D64545',
    success: '#3E8F5D',
    shadow: '#0A1E33',
    overlay: 'rgba(10, 30, 51, 0.32)',
  },
  alpineDusk: {
    label: 'Alpine Blue',
    statusBarStyle: 'light',
    gradient: ['#173A5E', '#0E2338', '#050D16'],
    card: 'rgba(180, 215, 245, 0.07)',
    cardBorder: 'rgba(180, 215, 245, 0.16)',
    cardElevated: 'rgba(14, 35, 56, 0.97)',
    text: '#E4F1FC',
    textMuted: '#A8C6DE',
    accent: '#5FB0F0',
    accentSoft: 'rgba(95, 176, 240, 0.18)',
    onAccent: '#0E2338',
    danger: '#E5484D',
    success: '#6FDB93',
    shadow: '#000000',
    overlay: 'rgba(5, 10, 16, 0.5)',
  },
};

// One entry per selectable color FAMILY (as opposed to `themes` above, which
// is one entry per individual light/dark PALETTE) — this is what the theme
// picker in MyStackScreen renders, and what ThemeContext resolves against
// the light/dark mode preference to pick an actual `themes` key. All four
// are free and unlocked for every account.
export const themeFamilies = [
  { id: 'classic', label: 'Classic', light: 'dawn', dark: 'dusk' },
  { id: 'purple', label: 'Purple', light: 'purpleDawn', dark: 'purpleDusk' },
  { id: 'forest', label: 'Forest Green', light: 'forestDawn', dark: 'forestDusk' },
  { id: 'alpine', label: 'Alpine Blue', light: 'alpineDawn', dark: 'alpineDusk' },
];

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
