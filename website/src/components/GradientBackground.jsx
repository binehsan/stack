import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from './GradientBackground.module.css';

// Web port of frontend/src/components/GradientBackground.js. Same three
// layers: an instant base gradient, a fading "ghost" of the previous
// theme's gradient (crossfades theme switches instead of hard-cutting),
// and a slow-drifting oversized copy for subtle ambient motion.
export default function GradientBackground({ children, className, fullHeight = true }) {
  const { theme } = useTheme();
  const gradientCss = `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]}, ${theme.gradient[2]})`;
  const prevRef = useRef(theme.gradient);
  const [outgoing, setOutgoing] = useState(null);

  useEffect(() => {
    if (prevRef.current === theme.gradient) return;
    const old = prevRef.current;
    prevRef.current = theme.gradient;
    setOutgoing(`linear-gradient(135deg, ${old[0]}, ${old[1]}, ${old[2]})`);
    const t = setTimeout(() => setOutgoing(null), 500);
    return () => clearTimeout(t);
  }, [theme.gradient]);

  return (
    <div className={[styles.wrap, fullHeight && styles.fullHeight, className].filter(Boolean).join(' ')}>
      <div className={styles.base} style={{ background: gradientCss }} />
      <AnimatePresence>
        {outgoing && (
          <motion.div
            className={styles.layer}
            style={{ background: outgoing }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        )}
      </AnimatePresence>
      <motion.div
        className={styles.drift}
        style={{ background: gradientCss }}
        initial={{ x: -16, y: -16, opacity: 0.2 }}
        animate={{ x: 12, y: 12, opacity: 0.4 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
