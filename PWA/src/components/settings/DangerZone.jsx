import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import AuthTextField from '../AuthTextField';
import PrimaryButton from '../PrimaryButton';
import ErrorBanner from '../ErrorBanner';
import styles from './DangerZone.module.css';

// Two layers between a click and an irreversible delete: the password
// field must be filled before the first button even flips to a confirm
// state, and the actual delete only fires from a native window.confirm
// inside an explicit "are you sure" panel. `deleteAccount` and `onDeleted`
// are passed in from Settings (deleteAccount from useAuth(), onDeleted
// navigates to `/`).
export default function DangerZone({ deleteAccount, onDeleted }) {
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  function handleRequestDelete(event) {
    event.preventDefault();
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setError(null);
    setConfirming(true);
  }

  async function handleConfirmDelete() {
    const confirmed = window.confirm(
      'This permanently deletes your account, tasks, and group stacks. This cannot be undone. Continue?'
    );
    if (!confirmed) return;

    setError(null);
    setDeleting(true);
    try {
      await deleteAccount(password);
      onDeleted?.();
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <AlertTriangle size={16} className={styles.icon} />
        <h3 className="text-body-strong">Danger zone</h3>
      </div>
      <p className="text-small text-muted">
        Deleting your account permanently removes your tasks, group stacks, and profile. This
        can't be undone.
      </p>

      <ErrorBanner message={error} />

      {!confirming ? (
        <form onSubmit={handleRequestDelete} className={styles.form}>
          <AuthTextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Confirm your password"
            autoComplete="current-password"
          />
          <PrimaryButton type="submit" title="Delete account" variant="danger" />
        </form>
      ) : (
        <div className={styles.confirmRow}>
          <p className="text-small">Are you absolutely sure? This is permanent.</p>
          <div className={styles.confirmActions}>
            <PrimaryButton
              variant="ghost"
              title="Cancel"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            />
            <PrimaryButton
              variant="danger"
              title="Yes, delete my account"
              onClick={handleConfirmDelete}
              loading={deleting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
