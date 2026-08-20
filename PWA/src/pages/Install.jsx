import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check, Mic, Share, SquarePlus, Wifi, Zap } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import InstallButton from '../components/InstallButton';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import { useLanguage } from '../context/LanguageContext';
import styles from './Install.module.css';

const WHY_ICONS = [Zap, Bell, Mic, Wifi];
const WHY_KEYS = ['noAppStore', 'pushNotif', 'voiceInput', 'offline'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Install() {
  const { t } = useLanguage();

  const WHY = WHY_KEYS.map((key, i) => ({
    icon: WHY_ICONS[i],
    text: t(`marketing.install.why.${key}`),
  }));
  const ANDROID_STEPS = t('marketing.install.androidSteps');
  const IOS_STEPS = t('marketing.install.iosSteps');

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
          <p className="text-tiny text-accent">{t('marketing.install.eyebrow')}</p>
          <h1 className={styles.heroTitle}>{t('marketing.install.heroTitle')}</h1>
          <p className={styles.heroBody}>{t('marketing.install.heroBody')}</p>
          <div className={styles.heroActions}>
            <InstallButton iosScrollTargetId="ios-steps" />
          </div>
          <p className={styles.heroStat}>{t('marketing.install.heroStat')}</p>
        </motion.div>
      </section>

      <section className={styles.why}>
        <div className={styles.whyGrid}>
          {WHY.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className={styles.whyItem}
            >
              <span className={styles.whyIcon}>
                <Icon size={16} strokeWidth={2.25} />
              </span>
              <span className={`text-small ${styles.whyText}`}>{text}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.steps}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
        >
          <Card elevated className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepIconBadge}>
                <SquarePlus size={18} strokeWidth={2.25} />
              </span>
              <h2 className="text-title">{t('marketing.install.androidTitle')}</h2>
            </div>
            <ol className={styles.stepList}>
              {ANDROID_STEPS.map((step, i) => (
                <li key={i} className={styles.stepItem}>
                  <span className={styles.stepNumber}>{i + 1}</span>
                  <span className="text-body">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </motion.div>

        <motion.div
          id="ios-steps"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <Card elevated className={styles.stepCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepIconBadge}>
                <Share size={18} strokeWidth={2.25} />
              </span>
              <h2 className="text-title">{t('marketing.install.iosTitle')}</h2>
            </div>
            <ol className={styles.stepList}>
              {IOS_STEPS.map((step, i) => (
                <li key={i} className={styles.stepItem}>
                  <span className={styles.stepNumber}>{i + 1}</span>
                  <span className="text-body">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </motion.div>
      </section>

      <section className={styles.desktopNote}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.35 }}
        >
          <p className={`text-small ${styles.desktopNoteText}`}>
            <Check size={14} strokeWidth={2.5} className={styles.desktopNoteIcon} /> {t('marketing.install.desktopNote')}
          </p>
        </motion.div>
      </section>

      <section className={styles.closing}>
        <motion.div
          className={styles.closingInner}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className={styles.closingTitle}>{t('marketing.install.closingTitle')}</h2>
          <p className={styles.closingBody}>{t('marketing.install.closingBody')}</p>
          <PrimaryButton as={Link} to="/signup" title={t('marketing.install.closingCta')} variant="solid" />
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
