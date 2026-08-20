import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';

import Avatar from '../components/groups/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import {
  createGroupStack,
  fetchGroupInvites,
  fetchMyGroupStacks,
  respondToGroupInvite,
} from '../api/groupStacks';
import { setBadgeCount } from '../push/badge';
import { useLanguage } from '../context/LanguageContext';
import styles from './GroupStacks.module.css';

// The "hub" for group stacks: every stack you're already in (click to
// open), pending invites, and a form to create another one. Web
// counterpart of frontend/src/screens/GroupStacksScreen.js.
export default function GroupStacks() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [stacks, setStacks] = useState([]);
  const [invites, setInvites] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  const [createName, setCreateName] = useState('');
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [myStacks, pending] = await Promise.all([fetchMyGroupStacks(), fetchGroupInvites()]);
      setStacks(myStacks);
      setInvites(pending);
    } catch (err) {
      console.warn('Failed to load group stacks:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Keep the installed app icon's badge in sync with pending invites —
  // the same "something needs your attention" signal a native app's
  // notification badge gives, without needing a push to have arrived.
  useEffect(() => {
    setBadgeCount(invites.length);
  }, [invites.length]);

  async function handleCreate(e) {
    e.preventDefault();
    const name = createName.trim();
    if (!name) {
      setCreateError(t('groups.groupStacks.createNameError'));
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const stack = await createGroupStack(name);
      setCreateName('');
      navigate(`/stacks/${stack.id}`);
    } catch (err) {
      setCreateError(err.message || 'Something went wrong, try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRespond(invite, action) {
    setRespondingId(invite.id);
    try {
      if (action === 'accept') {
        const stack = await respondToGroupInvite(invite.id, 'accept');
        setStacks((prev) => [stack, ...prev.filter((s) => s.id !== stack.id)]);
      } else {
        await respondToGroupInvite(invite.id, 'decline');
      }
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    } catch (err) {
      console.warn('Failed to respond to invite:', err.message);
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className="text-header">{t('groups.groupStacks.heading')}</h1>
      <p className={`text-small ${styles.tagline}`}>{t('groups.groupStacks.tagline')}</p>

      {loading ? (
        <div className={styles.loadingWrap}>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {stacks.length > 0 && (
            <section className={styles.section}>
              <h2 className={`text-tiny ${styles.sectionLabel}`}>{t('groups.groupStacks.sectionYourStacks')}</h2>
              <div>
                {stacks.map((stack, index) => (
                  <motion.div
                    key={stack.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                  >
                    <Link to={`/stacks/${stack.id}`} className={styles.stackRow}>
                      <Avatar uri={stack.image} label={stack.name} size={40} />
                      <div className={styles.stackRowText}>
                        <p className={`text-body-strong ${styles.stackRowName}`}>{stack.name}</p>
                        <p className={`text-small ${styles.stackRowMeta}`}>
                          {stack.members.length === 1
                            ? t('groups.groupStacks.memberOne')
                            : t('groups.groupStacks.memberOther', { count: stack.members.length })}
                        </p>
                      </div>
                      <ChevronRight size={20} className={styles.chevron} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {invites.length > 0 && (
            <section className={styles.section}>
              <h2 className={`text-tiny ${styles.sectionLabel}`}>{t('groups.groupStacks.pendingInvitesLabel')}</h2>
              <AnimatePresence initial={false}>
                {invites.map((invite) => (
                  <motion.div
                    key={invite.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className={styles.inviteCard}
                  >
                    <p className={`text-small ${styles.inviteCardText}`}>
                      {t('groups.groupStacks.invitedYouTo', {
                        username: `@${invite.invited_by_username}`,
                        stackName: invite.stack_name,
                      })}
                    </p>
                    <div className={styles.inviteActions}>
                      <button
                        type="button"
                        className={styles.declineButton}
                        onClick={() => handleRespond(invite, 'decline')}
                        disabled={respondingId === invite.id}
                      >
                        {t('groups.groupStacks.decline')}
                      </button>
                      <button
                        type="button"
                        className={styles.acceptButton}
                        onClick={() => handleRespond(invite, 'accept')}
                        disabled={respondingId === invite.id}
                      >
                        {respondingId === invite.id ? t('groups.groupStacks.joining') : t('groups.groupStacks.accept')}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </section>
          )}

          {stacks.length === 0 && invites.length === 0 && (
            <div className={styles.emptyState}>
              <Users size={40} strokeWidth={1.5} className={styles.emptyIcon} />
              <p className={`text-body-strong ${styles.emptyTitle}`}>{t('groups.groupStacks.emptyTitle')}</p>
              <p className={`text-small ${styles.emptySubtitle}`}>{t('groups.groupStacks.emptyBody')}</p>
            </div>
          )}

          <section className={styles.createSection}>
            <h2 className={`text-tiny ${styles.sectionLabel}`}>{t('groups.groupStacks.createSectionLabel')}</h2>
            <ErrorBanner message={createError} />
            <form onSubmit={handleCreate}>
              <AuthTextField
                label={t('groups.groupStacks.stackNameLabel')}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t('groups.groupStacks.stackNamePlaceholder')}
              />
              <PrimaryButton type="submit" title={t('groups.groupStacks.createButton')} loading={creating} />
            </form>
          </section>
        </>
      )}
    </div>
  );
}
