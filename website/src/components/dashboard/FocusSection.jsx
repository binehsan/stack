import { Star } from 'lucide-react';

import styles from './FocusSection.module.css';

const MAX_FOCUS = 3;

// Optional highlight strip for up to 3 starred "today's focus" tasks. Purely
// additive — starring is optional, and the page looks and works fine with
// zero stars (this section just doesn't render). Web port of
// frontend/src/components/FocusSection.js.
export default function FocusSection({ tasks, onToggle }) {
  const starred = tasks.filter((task) => task.starred);

  if (starred.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.labelRow}>
          <Star size={14} className={styles.starIcon} fill="currentColor" />
          <span className={`text-small ${styles.label}`}>Today&rsquo;s focus</span>
        </div>
        <span className="text-tiny text-muted">
          {starred.length}/{MAX_FOCUS}
        </span>
      </div>
      {starred.map((task) => (
        <button
          key={task.id}
          type="button"
          className={styles.row}
          onClick={() => onToggle(task)}
        >
          <span className={[styles.dot, task.completed && styles.dotDone].filter(Boolean).join(' ')} />
          <span
            className={[styles.text, task.completed && styles.textDone].filter(Boolean).join(' ')}
          >
            {task.text}
          </span>
        </button>
      ))}
    </div>
  );
}
