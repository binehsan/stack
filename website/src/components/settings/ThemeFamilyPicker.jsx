import { Lock } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { themeFamilies, themes } from '../../theme';
import styles from './ThemeFamilyPicker.module.css';

// All four theme families render for parity with the mobile app (see
// frontend/src/screens/MyStackScreen.js's themeSwatchRow), but the website
// has no billing/entitlement check (that's mobile-only, via RevenueCat) —
// so the three `pro: true` families are always shown locked here, never
// selectable, regardless of what account is signed in. Only `classic` is
// clickable.
export default function ThemeFamilyPicker() {
  const { themeFamily, setThemeFamily } = useTheme();

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {themeFamilies.map((family) => {
          const selected = family.id === themeFamily;
          const locked = family.pro;
          const swatchTheme = themes[family.light];
          const ringClass = [
            styles.swatchRing,
            selected && styles.selected,
            locked && styles.locked,
          ].filter(Boolean).join(' ');

          return (
            <div key={family.id} className={styles.item}>
              <button
                type="button"
                className={ringClass}
                onClick={() => !locked && setThemeFamily(family.id)}
                disabled={locked}
                aria-pressed={selected}
                aria-label={locked ? `${family.label} — available with Stack Pro` : family.label}
                title={locked ? 'Available with Stack Pro' : family.label}
              >
                <span
                  className={styles.swatch}
                  style={{
                    background: `linear-gradient(135deg, ${swatchTheme.gradient[0]}, ${swatchTheme.gradient[1]}, ${swatchTheme.gradient[2]})`,
                  }}
                >
                  {locked && (
                    <span className={styles.lockOverlay}>
                      <Lock size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </span>
              </button>
              {locked && (
                <span className={styles.proBadge} title="Available with Stack Pro">
                  Pro
                </span>
              )}
              <span className={`text-tiny ${styles.label} ${selected ? styles.labelSelected : ''}`}>
                {family.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className={`text-small text-muted ${styles.caption}`}>
        Classic is free — Premium Purple, Forest Green, and Alpine Blue are available with Stack Pro.
      </p>
    </div>
  );
}
