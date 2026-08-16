import logoMark from '../assets/logo-mark.png';
import styles from './Logo.module.css';

// Web port of frontend/src/components/Logo.js — same rounded-square mark
// with a fixed white ring (not theme-colored, for the same contrast reason
// the mobile comment explains: it must read against every gradient).
export default function Logo({ size = 64 }) {
  const border = Math.max(2, size * 0.035);
  return (
    <div
      className={styles.frame}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        borderWidth: border,
      }}
    >
      <img src={logoMark} alt="Stack" width={size} height={size} />
    </div>
  );
}
