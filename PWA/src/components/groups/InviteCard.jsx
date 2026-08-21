import { useState } from 'react';
import { motion } from 'framer-motion';

import AuthTextField from '../AuthTextField';
import PrimaryButton from '../PrimaryButton';
import ErrorBanner from '../ErrorBanner';
import { sendGroupInvite } from '../../api/groupStacks';
import { useLanguage } from '../../context/LanguageContext';
import styles from './InviteCard.module.css';

// The collapsible "invite by @username" form on a group stack's detail
// page — mirrors GroupStackDetailScreen's showInviteForm block.
export default function InviteCard({ stackId }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  // The raw username, not the composed success sentence — the sentence
  // mixes a translated (Urdu/Arabic) string with a Latin @handle, and that
  // handle needs its own `.latin` span (see index.css) so it isn't
  // reordered by the Unicode Bidi Algorithm inside an RTL sentence. Split
  // around the untouched '{{username}}' placeholder (t() called with no
  // vars leaves it literal) the same way Privacy.jsx isolates {{email}}.
  const [invitedUsername, setInvitedUsername] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError(t('groups.inviteCard.usernameRequired'));
      return;
    }
    setError(null);
    setInvitedUsername(null);
    setSending(true);
    try {
      await sendGroupInvite(stackId, trimmed);
      setInvitedUsername(trimmed.replace(/^@/, '').toLowerCase());
      setUsername('');
    } catch (err) {
      setError(err.message || t('groups.inviteCard.genericError'));
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
        {invitedUsername && (
          <p className={`text-small ${styles.success}`}>
            {(() => {
              const [before, after] = t('groups.inviteCard.invited').split('{{username}}');
              return (
                <>
                  {before}
                  <span className="latin">{invitedUsername}</span>
                  {after}
                </>
              );
            })()}
          </p>
        )}
        <div className={styles.row}>
          <div className={styles.field}>
            <AuthTextField
              label={t('groups.inviteCard.fieldLabel')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('groups.inviteCard.placeholder')}
              autoComplete="off"
            />
          </div>
          <PrimaryButton type="submit" title={t('groups.inviteCard.sendButton')} loading={sending} />
        </div>
      </div>
    </motion.form>
  );
}
