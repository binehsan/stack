import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';

import { usePushSubscription } from '../push/usePushSubscription';
import { useLanguage } from '../context/LanguageContext';
import BottomSheet from './BottomSheet';
import styles from './PermissionsPrompt.module.css';

const PROMPTED_KEY = 'stack_permissions_prompted';

function PermissionRow({ icon: Icon, label, description, status, onEnable }) {
  const { t } = useLanguage();
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
        <span className={styles.rowGranted} aria-label={t('common.permissionsPrompt.enabled')}>
          <Check size={16} strokeWidth={2.75} />
        </span>
      ) : (
        <button type="button" className={styles.rowButton} onClick={onEnable} disabled={status === 'requesting'}>
          {status === 'requesting'
            ? t('common.permissionsPrompt.asking')
            : status === 'denied'
              ? t('common.permissionsPrompt.tryAgain')
              : t('common.permissionsPrompt.enable')}
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
  const { t } = useLanguage();
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
    <BottomSheet open={!dismissed} dismissible={false} label={t('common.permissionsPrompt.sheetLabel')}>
      <h3 className={`text-title ${styles.title}`}>{t('common.permissionsPrompt.title')}</h3>
      <p className={`text-small ${styles.subtitle}`}>{t('common.permissionsPrompt.subtitle')}</p>

      <div className={styles.rows}>
        <PermissionRow
          icon={Bell}
          label={t('common.permissionsPrompt.notificationsLabel')}
          description={t('common.permissionsPrompt.notificationsDescription')}
          status={pushStatus}
          onEnable={subscribe}
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.skipButton} onClick={dismiss}>
          {t('common.permissionsPrompt.done')}
        </button>
      </div>
    </BottomSheet>
  );
}
