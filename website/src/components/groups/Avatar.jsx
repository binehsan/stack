import styles from './Avatar.module.css';

// A circular avatar image, or an initial-letter fallback when there's no
// image set — mirrors frontend/src/components/Avatar.js so a stack/member
// with no photo still reads consistently between mobile and web.
export default function Avatar({ uri, label, size = 40 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };

  if (uri) {
    return <img src={uri} alt="" className={styles.image} style={style} />;
  }

  const initial = (label || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div className={styles.fallback} style={style} aria-hidden="true">
      <span>{initial}</span>
    </div>
  );
}
