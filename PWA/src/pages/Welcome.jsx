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
import styles from './Welcome.module.css';

const UNLOCKED = [
  { icon: LayoutList, text: 'The full task dashboard, focus strip, and Dump, in any browser' },
  { icon: RefreshCw, text: 'Cross-sync between the mobile app and the website' },
  { icon: Laptop, text: 'Desktop app access, plus every future Stack app or plugin we ship' },
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
              <p className={`text-tiny text-accent ${styles.eyebrow}`}>You&rsquo;re in</p>
              <h1 className={`text-header ${styles.title}`}>Welcome to Stack</h1>
              <p className={`text-small text-muted ${styles.body}`}>
                Your account is ready. Here&rsquo;s what you&rsquo;ve got, free:
              </p>

              <ul className={styles.list}>
                {UNLOCKED.map(({ icon: Icon, text }) => (
                  <li key={text} className={styles.listRow}>
                    <span className={styles.listIcon}>
                      <Icon size={15} strokeWidth={2.25} />
                    </span>
                    <span className="text-body">{text}</span>
                  </li>
                ))}
              </ul>

              <PrimaryButton as={Link} to="/dashboard" title="Go to My Stack" variant="solid" />
            </Card>
          </motion.div>

          <SyntaxCredit />
        </div>
      </div>
    </GradientBackground>
  );
}
