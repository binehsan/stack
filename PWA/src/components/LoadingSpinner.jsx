import { motion } from 'framer-motion';

import styles from './LoadingSpinner.module.css';

// One shared loading indicator for every async wait in the app (task list,
// stats, profile, group stacks) instead of each page inventing its own
// "Loading…" text — a spinner reads as "the app is doing something" the way
// native activity indicators do, plain text reads as a placeholder.
export default function LoadingSpinner({ size = 28, label = 'Loading' }) {
  return (
    <motion.span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    />
  );
}
