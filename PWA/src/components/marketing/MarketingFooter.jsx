import { Link } from 'react-router-dom';

import Logo from '../Logo';
import SyntaxCredit from '../SyntaxCredit';
import { useLanguage } from '../../context/LanguageContext';
import styles from './MarketingFooter.module.css';

export default function MarketingFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link to="/" className={styles.brand}>
            <Logo size={28} />
            <span className={styles.brandName}>Stack</span>
          </Link>
          <p className={styles.tagline}>{t('marketing.footer.tagline')}</p>
        </div>

        <nav className={styles.links}>
          <Link to="/features" className={styles.link}>{t('marketing.footer.features')}</Link>
          <Link to="/install" className={styles.link}>{t('marketing.footer.install')}</Link>
          <Link to="/about" className={styles.link}>{t('marketing.footer.about')}</Link>
          <Link to="/login" className={styles.link}>{t('marketing.footer.login')}</Link>
          <Link to="/signup" className={styles.link}>{t('marketing.footer.getStarted')}</Link>
          <Link to="/privacy" className={styles.link}>{t('marketing.footer.privacy')}</Link>
        </nav>
      </div>

      <p className={styles.copyright}>{t('marketing.footer.copyright', { year })}</p>
      <SyntaxCredit />
    </footer>
  );
}
