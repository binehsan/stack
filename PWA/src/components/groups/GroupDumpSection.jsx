import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Trash2 } from 'lucide-react';

import GroupTaskItem from './GroupTaskItem';
import { useLanguage } from '../../context/LanguageContext';
import styles from './GroupDumpSection.module.css';

// Completed group tasks collapse out of the active list into here instead
// of piling up — web counterpart of frontend/src/components/
// GroupDumpSection.js. Collapsed by default, one click to review/undo/nudge.
export default function GroupDumpSection({ tasks, onToggle, onDelete, onNudge }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className={styles.container}>
      <button type="button" className={styles.header} onClick={() => setExpanded((prev) => !prev)}>
        <Trash2 size={14} strokeWidth={2} />
        <span className={`text-small ${styles.label}`}>{t('groups.groupDumpSection.label')}</span>
        <span className={`text-tiny ${styles.count}`}>{t('groups.groupDumpSection.doneCount', { count: tasks.length })}</span>
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
