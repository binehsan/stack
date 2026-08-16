import syntaxLogo from '../assets/syntax-logo.png';
import styles from './SyntaxCredit.module.css';

// Web port of frontend/src/components/SyntaxFooter.js — "A project of
// Syntax" credit, logo + text anchored on `--color-card` rather than sitting
// directly on the raw gradient. That mobile component's own comment explains
// why: near the bottom of a long scroll (which the gradient's diagonal makes
// the darker end, especially in light themes), a muted text color tuned for
// the pale end of the gradient reads as low-contrast. Anchoring to the card
// surface keeps this legible regardless of theme or scroll position — same
// principle applied everywhere else text sits over the animated background.
export default function SyntaxCredit({ detail }) {
  return (
    <div className={styles.wrap}>
      <img src={syntaxLogo} alt="Syntax" className={styles.logo} />
      <div className={styles.plate}>
        <span className={styles.text}>A project of Syntax</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </div>
    </div>
  );
}
