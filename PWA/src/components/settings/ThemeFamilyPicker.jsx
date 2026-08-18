import { useTheme } from '../../context/ThemeContext';
import { themeFamilies, themes } from '../../theme';
import styles from './ThemeFamilyPicker.module.css';

// All four theme families render for parity with the mobile app (see
// frontend/src/screens/MyStackScreen.js's themeSwatchRow) — every family is
// free and freely selectable, no locking or badge needed.
export default function ThemeFamilyPicker() {
  const { themeFamily, setThemeFamily } = useTheme();

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {themeFamilies.map((family) => {
          const selected = family.id === themeFamily;
          const swatchTheme = themes[family.light];
          const ringClass = [styles.swatchRing, selected && styles.selected].filter(Boolean).join(' ');

          return (
            <div key={family.id} className={styles.item}>
              <button
                type="button"
                className={ringClass}
                onClick={() => setThemeFamily(family.id)}
                aria-pressed={selected}
                aria-label={family.label}
                title={family.label}
              >
                <span
                  className={styles.swatch}
                  style={{
                    background: `linear-gradient(135deg, ${swatchTheme.gradient[0]}, ${swatchTheme.gradient[1]}, ${swatchTheme.gradient[2]})`,
                  }}
                />
              </button>
              <span className={`text-tiny ${styles.label} ${selected ? styles.labelSelected : ''}`}>
                {family.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
