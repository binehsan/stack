import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import GradientBackground from '../components/GradientBackground';
import Card from '../components/Card';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import styles from './Contact.module.css';

const SUPPORT_EMAIL = 'hello@stackapp.example';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Contact() {
  const { t } = useLanguage();
  const faqs = [
    { q: t('common.contact.faq1Q'), a: t('common.contact.faq1A') },
    { q: t('common.contact.faq2Q'), a: t('common.contact.faq2A') },
    { q: t('common.contact.faq3Q'), a: t('common.contact.faq3A') },
  ];

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
          <p className="text-tiny text-accent">{t('common.contact.eyebrow')}</p>
          <h1 className={styles.heroTitle}>{t('common.contact.title')}</h1>
          <p className={styles.heroBody}>{t('common.contact.body')}</p>
        </motion.div>
      </section>

      <section className={styles.emailSection}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
        >
          <Card elevated className={styles.emailCard}>
            <div className={styles.emailIcon}>
              <Mail size={20} strokeWidth={2.25} />
            </div>
            <div className={styles.emailText}>
              <p className={styles.emailLabel}>{t('common.contact.emailLabel')}</p>
              <p className={styles.emailSubtitle}>{t('common.contact.emailSubtitle')}</p>
            </div>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.emailLink} dir="ltr">
              {SUPPORT_EMAIL}
            </a>
          </Card>
        </motion.div>
      </section>

      <section className={styles.faqSection}>
        <motion.h2
          className={styles.faqTitle}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4 }}
        >
          {t('common.contact.faqTitle')}
        </motion.h2>
        <div className={styles.faqGrid}>
          {faqs.map(({ q, a }, i) => (
            <motion.div
              key={q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card className={styles.faqCard}>
                <p className={styles.faqQuestion}>{q}</p>
                <p className={styles.faqAnswer}>{a}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
