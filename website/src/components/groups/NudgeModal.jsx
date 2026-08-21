import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import Avatar from './Avatar';
import styles from './NudgeModal.module.css';

// Delegate a group task to another member — or clear the assignment back
// to "unassigned". Web counterpart of frontend/src/components/NudgeModal.js.
export default function NudgeModal({ task, members, onSelect, onClose }) {
  return (
    <AnimatePresence>
      {task && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Nudge someone"
          >
            <h3 className={`text-title ${styles.title}`}>Nudge someone</h3>
            <p className={`text-small ${styles.subtitle}`}>"{task.text}"</p>

            <div className={styles.memberList}>
              {task.assigned_to && (
                <button type="button" className={styles.memberRow} onClick={() => onSelect(null)}>
                  <span className={styles.clearIcon}>
                    <X size={16} strokeWidth={2.5} />
                  </span>
                  <span className="text-body">Clear nudge</span>
                </button>
              )}

              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={styles.memberRow}
                  onClick={() => onSelect(member.username)}
                >
                  <Avatar uri={member.avatar} label={member.username} size={32} />
                  <span className="text-body">@{member.username}</span>
                </button>
              ))}

              {members.length === 0 && !task.assigned_to && (
                <p className={`text-small ${styles.empty}`}>No other members to nudge yet.</p>
              )}
            </div>

            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
