// Small self-contained flag glyphs for the language picker — inline SVG
// rather than an icon-font/image dependency, so there's nothing to fetch
// and no extra bytes beyond these few paths. Simplified (not pixel-exact
// heraldry) since they only ever render at ~40px as a selection icon, the
// same tradeoff every OS language picker makes.
const wrap = { display: 'block', borderRadius: 4, overflow: 'hidden' };

export function FlagGB({ size = 32 }) {
  return (
    <svg viewBox="0 0 60 40" width={size} height={(size * 40) / 60} style={wrap} role="img" aria-hidden="true">
      <rect width="60" height="40" fill="#00247d" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#cf142b" strokeWidth="3.2" />
      <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="13" />
      <path d="M30,0 V40 M0,20 H60" stroke="#cf142b" strokeWidth="7.6" />
    </svg>
  );
}

export function FlagSA({ size = 32 }) {
  return (
    <svg viewBox="0 0 60 40" width={size} height={(size * 40) / 60} style={wrap} role="img" aria-hidden="true">
      <rect width="60" height="40" fill="#0b5c30" />
      <text
        x="30"
        y="19"
        textAnchor="middle"
        fontSize="7.4"
        fill="#fff"
        fontFamily="'Baloo Bhaijaan 2', 'Cairo', sans-serif"
        fontWeight="700"
      >
        لا إله إلا الله
      </text>
      <text
        x="30"
        y="27"
        textAnchor="middle"
        fontSize="7.4"
        fill="#fff"
        fontFamily="'Baloo Bhaijaan 2', 'Cairo', sans-serif"
        fontWeight="700"
      >
        محمد رسول الله
      </text>
      <rect x="12" y="31" width="36" height="2.6" fill="#fff" rx="1.3" />
      <rect x="9" y="31.6" width="4.5" height="1.4" fill="#fff" rx="0.7" />
    </svg>
  );
}

export function FlagPK({ size = 32 }) {
  return (
    <svg viewBox="0 0 60 40" width={size} height={(size * 40) / 60} style={wrap} role="img" aria-hidden="true">
      <rect width="60" height="40" fill="#01411c" />
      <rect width="15" height="40" fill="#fff" />
      <circle cx="38" cy="20" r="9" fill="#fff" />
      <circle cx="41" cy="20" r="7.4" fill="#01411c" />
      <path
        d="M46.5,12.5 L48.2,17.2 L53.2,17.2 L49.2,20.2 L50.7,25 L46.5,22 L42.3,25 L43.8,20.2 L39.8,17.2 L44.8,17.2 Z"
        fill="#fff"
      />
    </svg>
  );
}

export const FLAGS = { GB: FlagGB, SA: FlagSA, PK: FlagPK };
