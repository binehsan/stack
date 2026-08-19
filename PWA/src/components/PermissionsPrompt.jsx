import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';

import { usePushSubscription } from '../push/usePushSubscription';
import BottomSheet from './BottomSheet';
import styles from './PermissionsPrompt.module.css';

const PROMPTED_KEY = 'stack_permissions_prompted';

function PermissionRow({ icon: Icon, label, description, status, onEnable }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowIcon}>
        <Icon size={16} strokeWidth={2.25} />
      </span>
      <div className={styles.rowText}>
        <p className={styles.rowLabel}>{label}</p>
        <p className={styles.rowDescription}>{description}</p>
      </div>
      {status === 'granted' ? (
        <span className={styles.rowGranted} aria-label="Enabled">
          <Check size={16} strokeWidth={2.75} />
        </span>
      ) : (
        <button type="button" className={styles.rowButton} onClick={onEnable} disabled={status === 'requesting'}>
          {status === 'requesting' ? 'Asking…' : status === 'denied' ? 'Try again' : 'Enable'}
        </button>
      )}
    </div>
  );
}

// A one-time, right-after-first-login ask for notifications. Used to also
// ask for microphone access here (see git history / voice/useVoiceInput.js,
// still intact and unused) — pulled after voice input turned out unreliable
// enough in real testing that asking for a permission for a feature that
// visibly didn't work was worse than not asking at all.
export default function PermissionsPrompt() {
  const [dismissed, setDismissed] = useState(true);
  const { supported: pushSupported, permission: pushPermission, subscribed, loading: pushLoading, subscribe } =
    usePushSubscription();

  useEffect(() => {
    if (!pushSupported || localStorage.getItem(PROMPTED_KEY)) return;
    setDismissed(false);
  }, [pushSupported]);

  function dismiss() {
    localStorage.setItem(PROMPTED_KEY, '1');
    setDismissed(true);
  }

  const pushStatus = subscribed
    ? 'granted'
    : pushLoading
      ? 'requesting'
      : pushPermission === 'denied'
        ? 'denied'
        : 'idle';

  return (
    <BottomSheet open={!dismissed} dismissible={false} label="Enable notifications">
      <h3 className={`text-title ${styles.title}`}>Turn on notifications</h3>
      <p className={`text-small ${styles.subtitle}`}>
        Get notified about group invites and nudges. Stays reachable later from Settings if you
        skip it here.
      </p>

      <div className={styles.rows}>
        <PermissionRow
          icon={Bell}
          label="Notifications"
          description="For group invites and nudges"
          status={pushStatus}
          onEnable={subscribe}
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.skipButton} onClick={dismiss}>
          Done
        </button>
      </div>
    </BottomSheet>
  );
}
