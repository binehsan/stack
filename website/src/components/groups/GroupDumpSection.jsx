import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Trash2 } from 'lucide-react';

import GroupTaskItem from './GroupTaskItem';
import styles from './GroupDumpSection.module.css';

// Completed group tasks collapse out of the active list into here instead
// of piling up — web counterpart of frontend/src/components/
// GroupDumpSection.js. Collapsed by default, one click to review/undo/nudge.
export default function GroupDumpSection({ tasks, onToggle, onDelete, onNudge }) {
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className={styles.container}>
      <button type="button" className={styles.header} onClick={() => setExpanded((prev) => !prev)}>
        <Trash2 size={14} strokeWidth={2} />
        <span className={`text-small ${styles.label}`}>Dump</span>
        <span className={`text-tiny ${styles.count}`}>{tasks.length} done</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={styles.chevron}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.list}
          >
            <AnimatePresence initial={false}>
              {tasks.map((task) => (
                <GroupTaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onNudge={onNudge}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
