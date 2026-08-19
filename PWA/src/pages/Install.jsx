import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check, Mic, Share, SquarePlus, Wifi, Zap } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import InstallButton from '../components/InstallButton';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import styles from './Install.module.css';

const WHY = [
  { icon: Zap, text: 'No app store, no review wait — installs in seconds, and the whole thing is under 600KB, smaller than a single photo.' },
  { icon: Bell, text: 'Real push notifications for invites and nudges, same as a native app.' },
  { icon: Mic, text: 'Add tasks by voice, right from the keyboard.' },
  { icon: Wifi, text: 'Opens instantly, works offline for anything already loaded.' },
];

const ANDROID_STEPS = [
  'Open this site in Chrome (already here if you\'re reading this on your phone).',
  'Tap the ⋮ menu in the top-right corner.',
  'Tap "Install app" (if you don\'t see that exact wording, "Add to Home screen" does the same thing).',
  'Tap "Install" on the confirmation prompt.',
  'Open Stack from your home screen — that\'s it, you\'re in.',
];

const IOS_STEPS = [
  'Open this site in Safari specifically — Chrome and Firefox on iOS can\'t install it (an Apple restriction, not a Stack limitation).',
  'Tap the Share icon at the bottom of the screen (the square with an arrow pointing up).',
  'Scroll down and tap "Add to Home Screen".',
  'Tap "Add" in the top-right corner.',
  'Open Stack from your home screen — that\'s it, you\'re in.',
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Install() {
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
          <p className="text-tiny text-accent">Install Stack</p>
          <h1 className={styles.heroTitle}>On your home screen in under a minute</h1>
          <p className={styles.heroBody}>
            Stack is a Progressive Web App — it installs straight from your browser, no app store
            account, no waiting for approval, nothing to keep updated yourself. It looks, feels,
            and behaves like any other app on your phone once it's there.
          </p>
          <div className={styles.heroActions}>
            <InstallButton iosScrollTargetId="ios-steps" />
          </div>
          <p className={styles.heroStat}>Under 600KB total, and next to nothing on your data plan.</p>
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
              <h2 className="text-title">Android (Chrome)</h2>
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
              <h2 className="text-title">iPhone / iPad (Safari)</h2>
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
            <Check size={14} strokeWidth={2.5} className={styles.desktopNoteIcon} /> On a
            computer (Chrome/Edge), look for an install icon in the address bar, or the browser
            menu's "Install Stack…" option — same idea, one click.
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
          <h2 className={styles.closingTitle}>Don&rsquo;t have an account yet?</h2>
          <p className={styles.closingBody}>Free to start. No credit card, no setup.</p>
          <PrimaryButton as={Link} to="/signup" title="Get started free" variant="solid" />
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
