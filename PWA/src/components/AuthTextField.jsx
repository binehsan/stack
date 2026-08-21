import styles from './AuthTextField.module.css';

export default function AuthTextField({ label, error, ...rest }) {
  return (
    <label className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      {/* Every field this component renders (email, username, password) is
          Latin-only content — force it LTR and off the ambient RTL script's
          font regardless of the active language, see index.css's `.latin`. */}
      <input
        className={[styles.input, error && styles.inputError, 'latin'].filter(Boolean).join(' ')}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
