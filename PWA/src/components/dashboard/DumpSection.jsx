import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Trash2 } from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext';
import TaskItem from './TaskItem';
import styles from './DumpSection.module.css';

// Where completed tasks go to rest — collapsed by default so a satisfying
// checkmark doesn't turn into visual clutter at the bottom of the list.
// Expandable to review or undo (click to uncomplete, delete still works).
// Web port of frontend/src/components/DumpSection.js.
export default function DumpSection({ tasks, onToggle, onDelete, onToggleStar, starDisabled }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={styles.container}
    >
      <button type="button" className={styles.header} onClick={() => setExpanded((prev) => !prev)}>
        <Trash2 size={14} strokeWidth={2} className={styles.headerIcon} />
        <span className={`text-small ${styles.label}`}>{t('dashboard.dumpSection.label')}</span>
        <span className={`text-tiny text-muted ${styles.count}`}>
          {t('dashboard.dumpSection.count', { count: tasks.length })}
        </span>
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
          <motion.ul
            key="dump-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.list}
          >
            <AnimatePresence initial={false}>
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onToggleStar={onToggleStar}
                  starDisabled={starDisabled}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
