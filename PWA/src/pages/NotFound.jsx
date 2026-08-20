import { Link } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';
import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import styles from './NotFound.module.css';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <GradientBackground>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.brandMark}>
            <Logo size={56} />
            <h1 className={`text-header ${styles.wordmark}`}>{t('common.notFound.wordmark')}</h1>
          </div>

          <Card elevated className={styles.card}>
            <p className={`text-tiny ${styles.code}`}>{t('common.notFound.code')}</p>
            <h2 className={`text-title ${styles.title}`}>{t('common.notFound.title')}</h2>
            <p className={`text-small text-muted ${styles.body}`}>{t('common.notFound.body')}</p>
            <PrimaryButton as={Link} to="/" title={t('common.notFound.button')} variant="solid" />
          </Card>
        </div>
      </div>
    </GradientBackground>
  );
}
