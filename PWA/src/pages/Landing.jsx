import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, Users, RefreshCw, Flame, Sparkles } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import MarketingNav from '../components/marketing/MarketingNav';
import MarketingFooter from '../components/marketing/MarketingFooter';
import styles from './Landing.module.css';

const FEATURES = [
  {
    icon: Star,
    title: 'Focus',
    body: "Star up to three tasks and they rise into their own highlighted strip: today's actual priorities, not just everything you've ever dumped in.",
  },
  {
    icon: Trash2,
    title: 'Dump',
    body: 'Finish something and it slides into the Dump instead of vanishing, a collapsible archive of everything you knocked out today.',
  },
  {
    icon: Users,
    title: 'Group Stacks',
    body: 'Share a list with family, roommates, or friends. Everyone can add items and see who’s on the hook, no more "wait, did anyone buy milk?"',
  },
  {
    icon: RefreshCw,
    title: 'Synced everywhere',
    body: 'One account, free everywhere it runs — phone, tablet, and the web all stay on the same stack, with a desktop app for Windows and macOS too.',
  },
  {
    icon: Flame,
    title: 'Recap & streaks',
    body: 'A short recap of what you finished, plus a lightweight streak for showing up. No leaderboards, no guilt.',
  },
  {
    icon: Sparkles,
    title: 'Calm by design',
    body: 'Soft gradients, rounded corners, zero clutter, Stack stays out of your way even with fifteen tasks on screen. All four color families are free.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Landing() {
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
          <h1 className={styles.wordmark}>Stack</h1>
          <p className={styles.headline}>Your tasks, together.</p>
          <p className={styles.subheadline}>
            A calm place for your to-dos, whether solo or with the people you share life with. No due
            dates, no projects, no guilt backlog. Just today.
          </p>
          <div className={styles.heroActions}>
            <PrimaryButton as={Link} to="/signup" title="Get Stack, free" variant="solid" />
            <PrimaryButton as={Link} to="/login" title="Log in" variant="ghost" />
          </div>
          <p className={styles.heroNote}>
            Completely free, on the web and on mobile.
          </p>
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
          <p className="text-tiny text-accent">Why Stack</p>
          <h2 className={styles.featuresTitle}>Everything you need, nothing you don't</h2>
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
          <h2 className={styles.closingTitle}>Ready to get it out of your head?</h2>
          <p className={styles.closingBody}>
            Grab the free app for your phone, or use Stack in any browser — free either way.
          </p>
          <PrimaryButton as={Link} to="/signup" title="Get Stack, free" variant="solid" />
        </motion.div>
      </section>

      <MarketingFooter />
    </GradientBackground>
  );
}
