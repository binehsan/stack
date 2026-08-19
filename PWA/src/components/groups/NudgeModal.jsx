import { X } from 'lucide-react';

import Avatar from './Avatar';
import BottomSheet from '../BottomSheet';
import styles from './NudgeModal.module.css';

// Delegate a group task to another member — or clear the assignment back
// to "unassigned". Web counterpart of frontend/src/components/NudgeModal.js.
export default function NudgeModal({ task, members, onSelect, onClose }) {
  return (
    <BottomSheet open={Boolean(task)} onClose={onClose} label="Nudge someone">
      {task && (
        <>
          <h3 className={`text-title ${styles.title}`}>Nudge someone</h3>
          <p className={`text-small ${styles.subtitle}`}>"{task.text}"</p>

          <div className={styles.memberList}>
            {task.assigned_to && (
              <button type="button" className={styles.memberRow} onClick={() => onSelect(null)}>
                <span className={styles.clearIcon}>
                  <X size={16} strokeWidth={2.5} />
                </span>
                <span className="text-body">Clear assignment</span>
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
        </>
      )}
    </BottomSheet>
  );
}
