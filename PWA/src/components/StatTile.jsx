import { motion } from 'framer-motion';

import styles from './StatTile.module.css';

// Web counterpart of frontend/src/components/StatTile.js.
export default function StatTile({ Icon, value, label, sublabel, delay = 0 }) {
  return (
    <motion.div
      className={styles.tile}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Icon size={20} color="var(--color-accent)" strokeWidth={2} className={styles.icon} />
      <p className={styles.value}>{value}</p>
      <p className={`text-small ${styles.label}`}>{label}</p>
      {sublabel ? <p className={`text-tiny ${styles.sublabel}`}>{sublabel}</p> : null}
    </motion.div>
  );
}
