import { AnimatePresence, Reorder } from 'framer-motion';
import { Sun } from 'lucide-react';

import TaskItem from './TaskItem';
import styles from './TaskList.module.css';

// Renders the active (incomplete) tasks, newest-added first, draggable via
// each row's handle (framer-motion's Reorder.Group/Item — see TaskItem.jsx).
// Web port of frontend/src/components/TaskList.js, which drives the same
// reorder through react-native-draggable-flatlist; `onReorder` here mirrors
// that screen's `handleReorder` (see Dashboard.jsx).
export default function TaskList({
  tasks,
  onToggle,
  onDelete,
  onToggleStar,
  starDisabled,
  onReorder,
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
    <Reorder.Group as="ul" axis="y" values={tasks} onReorder={onReorder} className={styles.list}>
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskItem
            key={task.localId ?? task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onToggleStar={onToggleStar}
            starDisabled={starDisabled}
            draggable
          />
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}
