import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, Users, Sparkles } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import syntaxLogo from '../assets/syntax-logo.png';
import { useLanguage } from '../context/LanguageContext';
import styles from './About.module.css';

const PILLAR_ICONS = [Star, Trash2, Users, Sparkles];
const PILLAR_KEYS = ['focus', 'guilt', 'group', 'calm'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function About() {
  const { t } = useLanguage();
  const PILLARS = PILLAR_KEYS.map((key, i) => ({
    icon: PILLAR_ICONS[i],
    title: t(`marketing.about.pillars.${key}.title`),
    body: t(`marketing.about.pillars.${key}.body`),
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
          <p className="text-tiny text-accent">{t('marketing.about.eyebrow')}</p>
          <h1 className={styles.heroTitle}>{t('marketing.about.heroTitle')}</h1>
          <p className={styles.heroBody}>{t('marketing.about.heroBody')}</p>
        </motion.div>
      </section>

      <section className={styles.storySection}>
        <motion.div
          className={styles.storyBlock}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
        >
          <h2 className={styles.storyTitle}>{t('marketing.about.storyTitle')}</h2>
          <p className={styles.storyBody}>{t('marketing.about.storyBody1')}</p>
          <p className={styles.storyBody}>{t('marketing.about.storyBody2')}</p>
        </motion.div>
      </section>

      <section className={styles.pillars}>
        <div className={styles.pillarsGrid}>
          {PILLARS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card elevated className={styles.pillarCard}>
                <div className={styles.pillarIcon}>
                  <Icon size={18} strokeWidth={2.25} />
                </div>
                <h3 className={styles.pillarTitle}>{title}</h3>
                <p className={styles.pillarBody}>{body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className={styles.founder}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
        >
          <Card elevated className={styles.founderCard}>
            <img src={syntaxLogo} alt={t('marketing.about.founderLogoAlt')} className={styles.founderLogo} />
            <p className="text-tiny text-accent">{t('marketing.about.founderEyebrow')}</p>
            <h2 className={styles.founderName}>{t('marketing.about.founderName')}</h2>
            <p className={styles.founderRole}>{t('marketing.about.founderRole')}</p>
            <p className={styles.founderBody}>{t('marketing.about.founderBody')}</p>
          </Card>
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
          <h2 className={styles.closingTitle}>{t('marketing.about.closingTitle')}</h2>
          <p className={styles.closingBody}>{t('marketing.about.closingBody')}</p>
          <PrimaryButton as={Link} to="/signup" title={t('marketing.about.closingCta')} variant="solid" />
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
