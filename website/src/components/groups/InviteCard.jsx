import { useState } from 'react';
import { motion } from 'framer-motion';

import AuthTextField from '../AuthTextField';
import PrimaryButton from '../PrimaryButton';
import ErrorBanner from '../ErrorBanner';
import { sendGroupInvite } from '../../api/groupStacks';
import styles from './InviteCard.module.css';

// The collapsible "invite by @username" form on a group stack's detail
// page — mirrors GroupStackDetailScreen's showInviteForm block.
export default function InviteCard({ stackId }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Enter a username to invite.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSending(true);
    try {
      await sendGroupInvite(stackId, trimmed);
      setSuccess(`Invited @${trimmed.replace(/^@/, '').toLowerCase()}`);
      setUsername('');
    } catch (err) {
      setError(err.message || 'Something went wrong — try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <div className={styles.inner}>
        <ErrorBanner message={error} />
        {success && <p className={`text-small ${styles.success}`}>{success}</p>}
        <div className={styles.row}>
          <div className={styles.field}>
            <AuthTextField
              label="Invite by username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="off"
            />
          </div>
          <PrimaryButton type="submit" title="Send invite" loading={sending} />
        </div>
      </div>
    </motion.form>
  );
}
