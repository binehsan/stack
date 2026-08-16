import styles from './AuthTextField.module.css';

export default function AuthTextField({ label, error, ...rest }) {
  return (
    <label className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <input className={[styles.input, error && styles.inputError].filter(Boolean).join(' ')} {...rest} />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
