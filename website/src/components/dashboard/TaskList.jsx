import { AnimatePresence } from 'framer-motion';
import { Sun } from 'lucide-react';

import TaskItem from './TaskItem';
import styles from './TaskList.module.css';

// Renders the active (incomplete) tasks, newest-added first. Web port of
// frontend/src/components/TaskList.js's empty-state pattern — drag-to-reorder
// is intentionally out of scope for the web MVP (see Dashboard.jsx), so this
// is a plain list rather than a draggable one.
export default function TaskList({
  tasks,
  onToggle,
  onDelete,
  onToggleStar,
  starDisabled,
  // A component reference (e.g. `CheckCircle2`), not an icon name string —
  // callers import the lucide icon they want and pass it straight through.
  EmptyIcon = Sun,
  emptyTitle = 'Nothing on your plate yet',
  emptySubtitle = "Add a task above to start today's stack.",
}) {
  if (tasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <EmptyIcon size={40} strokeWidth={1.5} className={styles.emptyIcon} />
        <p className={`text-body-strong ${styles.emptyTitle}`}>{emptyTitle}</p>
        <p className={`text-small text-muted ${styles.emptySubtitle}`}>{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskItem
            key={task.localId ?? task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onToggleStar={onToggleStar}
            starDisabled={starDisabled}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
