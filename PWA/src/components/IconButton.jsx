import styles from './IconButton.module.css';

export default function IconButton({ children, onClick, label, size = 36, className, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[styles.button, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  );
}
