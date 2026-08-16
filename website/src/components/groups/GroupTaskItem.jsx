import { motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';

import Avatar from './Avatar';
import styles from './GroupTaskItem.module.css';

// A shared group-stack task row: checkbox + text, who it's assigned to,
// a "Nudge" button to delegate it, and delete — the web counterpart to
// frontend/src/components/GroupTaskItem.js (swipe-to-delete becomes a
// plain delete button, since there's no touch gesture on the web).
export default function GroupTaskItem({ task, onToggle, onDelete, onNudge }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.card}
    >
      <button type="button" className={styles.checkRow} onClick={() => onToggle(task)}>
        <span className={[styles.checkbox, task.completed && styles.checkboxCompleted].filter(Boolean).join(' ')}>
          {task.completed && <Check size={14} strokeWidth={3} />}
        </span>
        <span className={[styles.text, task.completed && styles.textCompleted].filter(Boolean).join(' ')}>
          {task.text}
        </span>
      </button>

      <button type="button" className={styles.nudgeButton} onClick={() => onNudge(task)}>
        <Avatar uri={task.assigned_to?.avatar} label={task.assigned_to?.username || '?'} size={26} />
        <span className={styles.nudgeLabel}>Nudge</span>
      </button>

      <button
        type="button"
        className={styles.deleteButton}
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}
