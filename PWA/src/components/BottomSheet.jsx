import { AnimatePresence, motion, useDragControls } from 'framer-motion';

import styles from './BottomSheet.module.css';

// A slide-up-from-bottom sheet with drag-to-dismiss via its handle — the
// native mobile convention for a transient choice, in place of a web-style
// centered dialog. Widens into a centered card on desktop (see
// BottomSheet.module.css's breakpoint) since there's no "bottom of the
// screen" affordance that makes sense with a mouse, and hides the grabber
// there since nothing drags it.
//
// The drag gesture is deliberately scoped to just the grabber handle
// (`dragControls` + `dragListener={false}`) rather than the whole sheet —
// some of this app's sheets have scrollable content (NudgeModal's member
// list), and a sheet-wide drag listener would fight the browser's native
// touch-scroll on every vertical swipe over that content, not just ones
// meant to dismiss it.
//
// `dismissible` gates backdrop-tap AND drag-to-dismiss together, and hides
// the handle when false — for sheets that require an explicit button choice
// (Recap, Carry-Forward) rather than being swipe-away-able, matching
// exactly what those callers already did as centered dialogs.
export default function BottomSheet({ open, onClose, dismissible = true, label, className, children }) {
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={dismissible ? onClose : undefined}
          role="presentation"
        >
          <motion.div
            className={[styles.sheet, className].filter(Boolean).join(' ')}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag={dismissible ? 'y' : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose?.();
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={label}
          >
            {dismissible && (
              <div className={styles.handle} onPointerDown={(e) => dragControls.start(e)}>
                <div className={styles.grabber} aria-hidden="true" />
              </div>
            )}
            <div className={styles.content}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
