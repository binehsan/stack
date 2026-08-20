import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, Users, RefreshCw, Flame, Sparkles } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import { useLanguage } from '../context/LanguageContext';
import styles from './Landing.module.css';

const FEATURE_ICONS = [Star, Trash2, Users, RefreshCw, Flame, Sparkles];
const FEATURE_KEYS = ['focus', 'dump', 'group', 'sync', 'recap', 'calm'];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Landing() {
  const { t } = useLanguage();
  const FEATURES = FEATURE_KEYS.map((key, i) => ({
    icon: FEATURE_ICONS[i],
    title: t(`marketing.landing.features.${key}.title`),
    body: t(`marketing.landing.features.${key}.body`),
  }));

  return (
    <GradientBackground>
      <MarketingNav />

      <section className={styles.hero}>
        <motion.div
          className={styles.heroInner}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Logo size={72} />
          <h1 className={styles.wordmark}>{t('marketing.landing.wordmark')}</h1>
          <p className={styles.headline}>{t('marketing.landing.headline')}</p>
          <p className={styles.subheadline}>{t('marketing.landing.subheadline')}</p>
          <div className={styles.heroActions}>
            <PrimaryButton as={Link} to="/signup" title={t('marketing.landing.getStackFree')} variant="solid" />
            <PrimaryButton as={Link} to="/login" title={t('marketing.landing.login')} variant="ghost" />
          </div>
          <p className={styles.heroNote}>{t('marketing.landing.heroNote')}</p>
        </motion.div>
      </section>

      <section className={styles.features}>
        <motion.div
          className={styles.featuresHeader}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-tiny text-accent">{t('marketing.landing.whyEyebrow')}</p>
          <h2 className={styles.featuresTitle}>{t('marketing.landing.whyTitle')}</h2>
        </motion.div>

        <div className={styles.grid}>
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card elevated className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon size={20} strokeWidth={2.25} />
                </div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureBody}>{body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.closing}>
        <motion.div
          className={styles.closingInner}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className={styles.closingTitle}>{t('marketing.landing.closingTitle')}</h2>
          <p className={styles.closingBody}>{t('marketing.landing.closingBody')}</p>
          <PrimaryButton as={Link} to="/signup" title={t('marketing.landing.closingCta')} variant="solid" />
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
