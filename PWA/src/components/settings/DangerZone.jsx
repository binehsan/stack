import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import AuthTextField from '../AuthTextField';
import PrimaryButton from '../PrimaryButton';
import ErrorBanner from '../ErrorBanner';
import { useLanguage } from '../../context/LanguageContext';
import styles from './DangerZone.module.css';

// Two layers between a click and an irreversible delete: the password
// field must be filled before the first button even flips to a confirm
// state, and the actual delete only fires from a native window.confirm
// inside an explicit "are you sure" panel. `deleteAccount` and `onDeleted`
// are passed in from Settings (deleteAccount from useAuth(), onDeleted
// navigates to `/`).
export default function DangerZone({ deleteAccount, onDeleted }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  function handleRequestDelete(event) {
    event.preventDefault();
    if (!password) {
      setError(t('settings.dangerZone.enterPasswordError'));
      return;
    }
    setError(null);
    setConfirming(true);
  }

  async function handleConfirmDelete() {
    const confirmed = window.confirm(t('settings.dangerZone.confirmDialogText'));
    if (!confirmed) return;

    setError(null);
    setDeleting(true);
    try {
      await deleteAccount(password);
      onDeleted?.();
    } catch (err) {
      setError(err.message || t('settings.dangerZone.failedDelete'));
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <AlertTriangle size={16} className={styles.icon} />
        <h3 className="text-body-strong">{t('settings.dangerZone.heading')}</h3>
      </div>
      <p className="text-small text-muted">{t('settings.dangerZone.description')}</p>

      <ErrorBanner message={error} />

      {!confirming ? (
        <form onSubmit={handleRequestDelete} className={styles.form}>
          <AuthTextField
            label={t('settings.dangerZone.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('settings.dangerZone.confirmPassword')}
            autoComplete="current-password"
          />
          <PrimaryButton type="submit" title={t('settings.dangerZone.deleteAccount')} variant="danger" />
        </form>
      ) : (
        <div className={styles.confirmRow}>
          <p className="text-small">{t('settings.dangerZone.confirmPrompt')}</p>
          <div className={styles.confirmActions}>
            <PrimaryButton
              variant="ghost"
              title={t('settings.dangerZone.cancel')}
              onClick={() => setConfirming(false)}
              disabled={deleting}
            />
            <PrimaryButton
              variant="danger"
              title={t('settings.dangerZone.yesDelete')}
              onClick={handleConfirmDelete}
              loading={deleting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
