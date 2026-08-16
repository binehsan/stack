import { Link } from 'react-router-dom';

import Logo from '../Logo';
import SyntaxCredit from '../SyntaxCredit';
import styles from './MarketingFooter.module.css';

export default function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link to="/" className={styles.brand}>
            <Logo size={28} />
            <span className={styles.brandName}>Stack</span>
          </Link>
          <p className={styles.tagline}>Your stack, wherever u are.</p>
        </div>

        <nav className={styles.links}>
          <Link to="/features" className={styles.link}>Features</Link>
          <Link to="/about" className={styles.link}>About</Link>
          <Link to="/login" className={styles.link}>Log in</Link>
          <Link to="/signup" className={styles.link}>Get started</Link>
        </nav>
      </div>

      <p className={styles.copyright}>&copy; {year} Stack. Made for calm todo lists.</p>
      <SyntaxCredit />
    </footer>
  );
}
