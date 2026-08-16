import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';

import Avatar from '../components/groups/Avatar';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import ErrorBanner from '../components/ErrorBanner';
import {
  createGroupStack,
  fetchGroupInvites,
  fetchMyGroupStacks,
  respondToGroupInvite,
} from '../api/groupStacks';
import styles from './GroupStacks.module.css';

// The "hub" for group stacks: every stack you're already in (click to
// open), pending invites, and a form to create another one. Web
// counterpart of frontend/src/screens/GroupStacksScreen.js.
export default function GroupStacks() {
  const navigate = useNavigate();

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

  async function handleCreate(e) {
    e.preventDefault();
    const name = createName.trim();
    if (!name) {
      setCreateError('Give your group stack a name.');
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const stack = await createGroupStack(name);
      setCreateName('');
      navigate(`/stacks/${stack.id}`);
    } catch (err) {
      if (err.code === 'PAYWALL_GROUP_LIMIT') {
        setCreateError("You've reached the free plan's group stack limit.");
      } else {
        setCreateError(err.message || 'Something went wrong — try again.');
      }
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
      <h1 className="text-header">Group Stacks</h1>
      <p className={`text-small ${styles.tagline}`}>Your stack, wherever u are</p>

      {loading ? (
        <div className={styles.loadingWrap}>
          <span className={styles.spinner} aria-label="Loading" />
        </div>
      ) : (
        <>
          {stacks.length > 0 && (
            <section className={styles.section}>
              <h2 className={`text-tiny ${styles.sectionLabel}`}>Your stacks</h2>
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
                          {stack.members.length} member{stack.members.length === 1 ? '' : 's'}
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
              <h2 className={`text-tiny ${styles.sectionLabel}`}>Pending invites</h2>
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
                      <span className={styles.inviteCardStrong}>@{invite.invited_by_username}</span>{' '}
                      invited you to{' '}
                      <span className={styles.inviteCardStrong}>{invite.stack_name}</span>
                    </p>
                    <div className={styles.inviteActions}>
                      <button
                        type="button"
                        className={styles.declineButton}
                        onClick={() => handleRespond(invite, 'decline')}
                        disabled={respondingId === invite.id}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className={styles.acceptButton}
                        onClick={() => handleRespond(invite, 'accept')}
                        disabled={respondingId === invite.id}
                      >
                        {respondingId === invite.id ? 'Joining…' : 'Accept'}
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
              <p className={`text-body-strong ${styles.emptyTitle}`}>No group stacks yet</p>
              <p className={`text-small ${styles.emptySubtitle}`}>
                Create one to share a task list with family, friends, roommates — anyone. Everyone
                can add items and see who's on the hook.
              </p>
            </div>
          )}

          <section className={styles.createSection}>
            <h2 className={`text-tiny ${styles.sectionLabel}`}>Create a new stack</h2>
            <ErrorBanner message={createError} />
            <form onSubmit={handleCreate}>
              <AuthTextField
                label="Stack name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="The Smiths, College Friends…"
              />
              <PrimaryButton type="submit" title="Create group stack" loading={creating} />
            </form>
          </section>
        </>
      )}
    </div>
  );
}
