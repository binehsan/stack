import { useEffect, useRef, useState } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { Check, GripVertical, Star, Trash2 } from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext';
import styles from './TaskItem.module.css';

// A single row in the stack. Web port of frontend/src/components/TaskItem.js:
// - mount/unmount handled by the parent's AnimatePresence (fade + slide)
// - a small checkbox "bounce" on toggle (spring scale)
// - a strike-through that draws on left-to-right, same trick as mobile: a
//   real `text-decoration: line-through` span sits on top, clipped by an
//   absolutely-positioned wrapper whose width animates from 0 to the
//   measured text width. That guarantees the strike sits exactly where the
//   browser would render it natively, while still looking hand-drawn-on
//   instead of appearing instantly.
// - a star toggle that pops when starring/unstarring for focus mode
// - swipe-to-delete has no web equivalent, so a Trash2 icon button replaces
//   it — always visible/reachable (not hover-only), just dimmed until
//   hover/focus on pointer devices for a cleaner resting look.
// - `draggable` (only ever true from TaskList, which wraps its rows in a
//   Reorder.Group — see TaskList.jsx) swaps the wrapper for Reorder.Item and
//   shows a dedicated drag handle. A dedicated handle (rather than making
//   the whole row draggable) is deliberate: without it, starting a drag
//   would fight with tapping the checkbox/star/delete buttons and with
//   touch-scrolling the page.
export default function TaskItem({ task, onToggle, onDelete, onToggleStar, starDisabled, draggable = false }) {
  const { t } = useLanguage();
  const [bounce, setBounce] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  const textRef = useRef(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.offsetWidth);
    }
  }, [task.text]);

  function handleToggle() {
    setBounce(true);
    onToggle(task);
    window.setTimeout(() => setBounce(false), 180);
  }

  function handleStar() {
    if (!task.starred && starDisabled) return;
    onToggleStar?.(task);
  }

  function handleDelete() {
    onDelete(task.id);
  }

  const Wrapper = draggable ? Reorder.Item : motion.li;
  const wrapperProps = {
    layout: true,
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 16 },
    transition: { duration: 0.22 },
    className: styles.wrapper,
    ...(draggable && {
      value: task,
      dragListener: false,
      dragControls,
      whileDrag: { scale: 1.02, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.18)', zIndex: 1 },
    }),
  };

  return (
    <Wrapper {...wrapperProps}>
      <div className={styles.card}>
        {draggable && (
          <span
            className={styles.dragHandle}
            onPointerDown={(e) => dragControls.start(e)}
            aria-label={t('dashboard.taskItem.dragToReorder')}
            role="button"
            tabIndex={-1}
          >
            <GripVertical size={16} />
          </span>
        )}

        <button type="button" className={styles.checkRow} onClick={handleToggle}>
          <motion.span
            animate={{ scale: bounce ? 1.08 : 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 300 }}
            className={[styles.checkbox, task.completed && styles.checkboxCompleted]
              .filter(Boolean)
              .join(' ')}
          >
            <motion.span
              animate={{ opacity: task.completed ? 1 : 0, scale: task.completed ? 1 : 0.4 }}
              transition={{ duration: 0.18 }}
              className={styles.checkIcon}
            >
              <Check size={14} strokeWidth={3} />
            </motion.span>
          </motion.span>

          <span className={styles.textWrap}>
            <span
              ref={textRef}
              className={[styles.text, task.completed && styles.textCompleted]
                .filter(Boolean)
                .join(' ')}
            >
              {task.text}
            </span>
            <motion.span
              animate={{ width: task.completed ? textWidth : 0 }}
              transition={{ duration: 0.32 }}
              className={styles.strikeClip}
            >
              <span className={styles.strikeText} style={{ width: textWidth }}>
                {task.text}
              </span>
            </motion.span>
          </span>
        </button>

        {onToggleStar && (
          <button
            type="button"
            className={styles.starButton}
            onClick={handleStar}
            aria-label={task.starred ? t('dashboard.taskItem.removeFromFocus') : t('dashboard.taskItem.addToFocus')}
            aria-pressed={task.starred}
          >
            <motion.span
              animate={{ scale: task.starred ? 1.1 : 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 300 }}
              className={!task.starred && starDisabled ? styles.starDisabled : undefined}
            >
              <Star
                size={20}
                className={task.starred ? styles.starFilled : styles.starOutline}
                fill={task.starred ? 'currentColor' : 'transparent'}
                strokeWidth={task.starred ? 0 : 1.75}
              />
            </motion.span>
          </button>
        )}

        <button
          type="button"
          className={styles.deleteButton}
          onClick={handleDelete}
          aria-label={t('dashboard.taskItem.deleteTask')}
        >
          <Trash2 size={17} strokeWidth={2} />
        </button>
      </div>
    </Wrapper>
  );
}
