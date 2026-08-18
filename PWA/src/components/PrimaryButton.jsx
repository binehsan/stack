import styles from './PrimaryButton.module.css';

export default function PrimaryButton({
  title,
  onClick,
  loading,
  disabled,
  type = 'button',
  variant = 'solid', // 'solid' | 'ghost' | 'danger'
  as: As = 'button',
  href,
  ...rest
}) {
  const isDisabled = disabled || loading;
  const className = [styles.button, styles[variant], isDisabled && styles.disabled].filter(Boolean).join(' ');

  if (As !== 'button') {
    return (
      <As href={href} className={className} {...rest}>
        {title}
      </As>
    );
  }

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-label="Loading" /> : title}
    </button>
  );
}
