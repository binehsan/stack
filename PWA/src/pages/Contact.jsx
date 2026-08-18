import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Card from '../components/Card';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import styles from './Contact.module.css';

const SUPPORT_EMAIL = 'hello@stackapp.example';

const FAQS = [
  {
    q: 'Is Stack free?',
    a: 'Yes, completely — the mobile app and the website, no credit card required, no paid tier.',
  },
  {
    q: 'What do I get on the website versus the app?',
    a: 'The same Stack experience either way: your tasks, Group Stacks, and everything synced. Use whichever is convenient, or both at once.',
  },
  {
    q: 'I found a bug. Where do I report it?',
    a: 'Email us with what happened and what device or browser you were using, and we\'ll take a look.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Contact() {
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
          <p className="text-tiny text-accent">Contact</p>
          <h1 className={styles.heroTitle}>Get in touch</h1>
          <p className={styles.heroBody}>
            Questions, feedback, or something not working the way it should? We read every
            message, drop us a line.
          </p>
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
              <p className={styles.emailLabel}>Email us</p>
              <p className={styles.emailSubtitle}>We typically reply within a day or two.</p>
            </div>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.emailLink}>
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
          A few common questions
        </motion.h2>
        <div className={styles.faqGrid}>
          {FAQS.map(({ q, a }, i) => (
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
