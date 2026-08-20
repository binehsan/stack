import { useLanguage } from '../../context/LanguageContext';
import { FLAGS } from './Flags';
import styles from './ThemeFamilyPicker.module.css';

// Deliberately reuses ThemeFamilyPicker's exact CSS module (same
// ring/swatch/label rhythm as the color-family row right above it in
// Settings) instead of a parallel stylesheet, so the two rows read as one
// consistent picker pattern rather than two different UI languages.
export default function LanguagePicker() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {languages.map((lang) => {
          const selected = lang.id === language;
          const Flag = FLAGS[lang.flag];
          const ringClass = [styles.swatchRing, selected && styles.selected].filter(Boolean).join(' ');

          return (
            <div key={lang.id} className={styles.item}>
              <button
                type="button"
                className={ringClass}
                onClick={() => setLanguage(lang.id)}
                aria-pressed={selected}
                aria-label={lang.label}
                title={lang.label}
              >
                <span className={styles.swatch}>
                  <Flag size={40} />
                </span>
              </button>
              <span className={`text-tiny ${styles.label} ${selected ? styles.labelSelected : ''}`}>
                {lang.nativeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
