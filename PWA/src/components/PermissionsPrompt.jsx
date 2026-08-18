import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Mic } from 'lucide-react';

import { usePushSubscription } from '../push/usePushSubscription';
import { primeMicPermission } from '../voice/useVoiceInput';
import PrimaryButton from './PrimaryButton';
import styles from './PermissionsPrompt.module.css';

const PROMPTED_KEY = 'stack_permissions_prompted';

// A one-time, right-after-first-login ask for both notifications and mic
// access together — the native-app-onboarding pattern of asking upfront
// instead of only lazily the first time someone happens to tap a
// mic/notification-gated feature. Shows once ever per browser (tracked in
// localStorage), regardless of whether either permission was actually
// granted — re-asking on every visit would be more annoying than useful,
// and both are still reachable later from Settings if skipped here.
export default function PermissionsPrompt() {
  const [dismissed, setDismissed] = useState(true);
  const [working, setWorking] = useState(false);
  const { supported: pushSupported, subscribe } = usePushSubscription();

  useEffect(() => {
    if (!localStorage.getItem(PROMPTED_KEY)) setDismissed(false);
  }, []);

  function dismiss() {
    localStorage.setItem(PROMPTED_KEY, '1');
    setDismissed(true);
  }

  async function handleEnable() {
    setWorking(true);
    try {
      await Promise.allSettled([pushSupported ? subscribe() : Promise.resolve(), primeMicPermission()]);
    } finally {
      setWorking(false);
      dismiss();
    }
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.26 }}
            role="dialog"
            aria-modal="true"
            aria-label="Enable notifications and voice input"
          >
            <div className={styles.iconRow}>
              <span className={styles.iconBadge}>
                <Bell size={18} strokeWidth={2.25} />
              </span>
              <span className={styles.iconBadge}>
                <Mic size={18} strokeWidth={2.25} />
              </span>
            </div>
            <h3 className={`text-title ${styles.title}`}>Turn on notifications & voice input</h3>
            <p className={`text-small ${styles.subtitle}`}>
              Get notified about group invites and nudges, and add tasks by speaking instead of
              typing. You can change either of these later in Settings.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.skipButton} onClick={dismiss}>
                Not now
              </button>
              <PrimaryButton title="Enable" onClick={handleEnable} loading={working} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
