import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { LayoutList, Laptop, RefreshCw } from 'lucide-react';

import GradientBackground from '../components/GradientBackground';
import Logo from '../components/Logo';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import SyntaxCredit from '../components/SyntaxCredit';
import { useLanguage } from '../context/LanguageContext';
import styles from './Welcome.module.css';

const UNLOCKED = [
  { icon: LayoutList, key: 'unlock1' },
  { icon: RefreshCw, key: 'unlock2' },
  { icon: Laptop, key: 'unlock3' },
];

// Reads the *active* theme's actual colors off the root element rather than
// hardcoding a palette, so the confetti matches whichever of the four theme
// families (and dawn/dusk mode) the visitor happens to be using.
function themeConfettiColors() {
  const style = getComputedStyle(document.documentElement);
  const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return [
    read('--color-accent', '#A8551C'),
    read('--gradient-1', '#FFEB97'),
    read('--gradient-2', '#E7B768'),
  ];
}

function fireConfetti() {
  const colors = themeConfettiColors();
  const common = { colors, disableForReducedMotion: true };
  confetti({ ...common, particleCount: 90, spread: 70, origin: { x: 0.2, y: 0.6 } });
  confetti({ ...common, particleCount: 90, spread: 70, origin: { x: 0.8, y: 0.6 } });
  confetti({ ...common, particleCount: 60, spread: 100, startVelocity: 45, origin: { y: 0.4 } });
}

// Lands right after signup (see Signup.jsx) — a quick "here's what you get"
// moment before the dashboard, now that every account unlocks everything.
export default function Welcome() {
  const firedRef = useRef(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    fireConfetti();
  }, []);

  return (
    <GradientBackground>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42 }}
            className={styles.brandMark}
          >
            <Logo size={56} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <Card elevated className={styles.card}>
              <p className={`text-tiny text-accent ${styles.eyebrow}`}>{t('auth.welcome.eyebrow')}</p>
              <h1 className={`text-header ${styles.title}`}>{t('auth.welcome.title')}</h1>
              <p className={`text-small text-muted ${styles.body}`}>{t('auth.welcome.body')}</p>

              <ul className={styles.list}>
                {UNLOCKED.map(({ icon: Icon, key }) => (
                  <li key={key} className={styles.listRow}>
                    <span className={styles.listIcon}>
                      <Icon size={15} strokeWidth={2.25} />
                    </span>
                    <span className="text-body">{t(`auth.welcome.${key}`)}</span>
                  </li>
                ))}
              </ul>

              <PrimaryButton as={Link} to="/dashboard" title={t('auth.welcome.cta')} variant="solid" />
            </Card>
          </motion.div>

          <SyntaxCredit />
        </div>
      </div>
    </GradientBackground>
  );
}
