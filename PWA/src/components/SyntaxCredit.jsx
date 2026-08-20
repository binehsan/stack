import syntaxLogo from '../assets/syntax-logo.png';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
  return (
    <div className={styles.wrap}>
      <img src={syntaxLogo} alt={t('common.syntaxCredit.alt')} className={styles.logo} />
      <div className={styles.plate}>
        <span className={styles.text}>{t('common.syntaxCredit.text')}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </div>
    </div>
  );
}
