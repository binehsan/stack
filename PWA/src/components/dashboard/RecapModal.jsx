import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import BottomSheet from '../BottomSheet';
import styles from './RecapModal.module.css';

// A once-per-day, non-punishing summary. No streaks, no red framing — just
// a warm "here's how yesterday went", with a little extra sparkle if most
// or all of it got done. Web counterpart of
// frontend/src/components/RecapModal.js.
export default function RecapModal({ visible, recap, onClose }) {
  if (!recap) return null;

  const { total, completed } = recap;
  const ratio = total === 0 ? 0 : completed / total;
  const celebrate = total > 0 && ratio >= 0.7;

  const message = celebrate
    ? completed === total
      ? "You cleared the whole stack. Nicely done."
      : 'Great day — most of it got done.'
    : completed === 0
      ? "A quiet day. Today's a clean slate."
      : "Here's how yesterday went.";

  return (
    <BottomSheet open={visible} dismissible={false} label="Yesterday's recap">
      <div className={styles.card}>
        {celebrate && (
          <div className={styles.sparkleRow} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 6, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.32, delay: i * 0.09 }}
              >
                <Sparkles size={20} color="var(--color-accent)" fill="var(--color-accent)" />
              </motion.span>
            ))}
          </div>
        )}

        <p className="text-tiny text-muted">Yesterday&rsquo;s recap</p>
        <motion.p
          className={styles.tally}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.32, delay: 0.1 }}
        >
          {completed} <span className={styles.tallyMuted}>of {total}</span>
        </motion.p>
        <p className={`text-body ${styles.message}`}>{message}</p>

        <button type="button" className={styles.button} onClick={onClose}>
          Start today
        </button>
      </div>
    </BottomSheet>
  );
}
