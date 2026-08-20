import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { themeFamilies, themes } from '../../theme';
import styles from './ThemeFamilyPicker.module.css';

// All four theme families render for parity with the mobile app (see
// frontend/src/screens/MyStackScreen.js's themeSwatchRow) — every family is
// free and freely selectable, no locking or badge needed.
//
// Labels are translated via `settings.themeFamily.<id>` rather than
// `family.label` directly — theme.js is ported 1:1 from the mobile app's
// theme.js and deliberately kept in English/in sync with it, so the
// translation layer sits on top of it here instead of touching that file.
export default function ThemeFamilyPicker() {
  const { themeFamily, setThemeFamily } = useTheme();
  const { t } = useLanguage();

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {themeFamilies.map((family) => {
          const selected = family.id === themeFamily;
          const swatchTheme = themes[family.light];
          const ringClass = [styles.swatchRing, selected && styles.selected].filter(Boolean).join(' ');
          const label = t(`settings.themeFamily.${family.id}`);

          return (
            <div key={family.id} className={styles.item}>
              <button
                type="button"
                className={ringClass}
                onClick={() => setThemeFamily(family.id)}
                aria-pressed={selected}
                aria-label={label}
                title={label}
              >
                <span
                  className={styles.swatch}
                  style={{
                    background: `linear-gradient(135deg, ${swatchTheme.gradient[0]}, ${swatchTheme.gradient[1]}, ${swatchTheme.gradient[2]})`,
                  }}
                />
              </button>
              <span className={`text-tiny ${styles.label} ${selected ? styles.labelSelected : ''}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
