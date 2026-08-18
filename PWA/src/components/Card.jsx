import styles from './Card.module.css';

export default function Card({ children, elevated, className, style, ...rest }) {
  const cls = [styles.card, elevated && styles.elevated, className].filter(Boolean).join(' ');
  return (
    <div className={cls} style={style} {...rest}>
      {children}
    </div>
  );
}
