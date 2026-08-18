import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <GradientBackground>
      <div className={styles.wrap}>
        <Link to="/" className={styles.backButton} aria-label="Back to home">
          <ChevronLeft size={18} strokeWidth={2.5} />
          <span>Back</span>
        </Link>

        <div className={styles.inner}>
          <div className={styles.brandMark}>
            <Logo size={56} />
            <h1 className={`text-header ${styles.wordmark}`}>Stack</h1>
          </div>

          <Card elevated className={styles.card}>
            <p className={`text-tiny ${styles.code}`}>404</p>
            <h2 className={`text-title ${styles.title}`}>Page not found</h2>
            <p className={`text-small text-muted ${styles.body}`}>
              The page you're looking for doesn't exist or may have moved.
            </p>
            <PrimaryButton as={Link} to="/" title="Back to home" variant="solid" />
          </Card>
        </div>
      </div>
    </GradientBackground>
  );
}
