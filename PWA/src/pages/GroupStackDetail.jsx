import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Camera, CheckCircle2, ClipboardList, LogOut } from 'lucide-react';

import Avatar from '../components/groups/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import MemberList from '../components/groups/MemberList';
import InviteCard from '../components/groups/InviteCard';
import GroupTaskInput from '../components/groups/GroupTaskInput';
import GroupTaskItem from '../components/groups/GroupTaskItem';
import GroupDumpSection from '../components/groups/GroupDumpSection';
import NudgeModal from '../components/groups/NudgeModal';
import {
  createGroupTask,
  deleteGroupTask,
  fetchGroupStack,
  fetchGroupTasks,
  leaveGroupStack,
  nudgeGroupTask,
  updateGroupStack,
  updateGroupTask,
} from '../api/groupStacks';
import { useLanguage } from '../context/LanguageContext';
import styles from './GroupStackDetail.module.css';

// One group stack's detail page — members, invite form, shared task list,
// nudge, and leave. Web counterpart of
// frontend/src/screens/GroupStackDetailScreen.js.
export default function GroupStackDetail() {
  const { stackId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [stack, setStack] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [nudgeTask, setNudgeTask] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const photoInputRef = useRef(null);

  // `silent` skips the loading-spinner/error-state churn — used by the
  // background poll and refocus refetch below so a new member showing up
  // in MemberList updates quietly instead of flashing the whole page back
  // to a spinner every time. Only the very first, real load shows that.
  const loadAll = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setLoadError(null);
      }
      try {
        const [stackData, taskData] = await Promise.all([
          fetchGroupStack(stackId),
          fetchGroupTasks(stackId),
        ]);
        setStack(stackData);
        setTasks(taskData);
      } catch (err) {
        console.warn('Failed to load group stack:', err.message);
        if (!silent) setLoadError(err.message || t('groups.groupStackDetail.loadError'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [stackId]
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Keeps other members' view of this stack current when someone new
  // accepts an invite — there's no websocket/realtime layer in this app, so
  // this is a plain poll (catches it while the page is just sitting open)
  // plus an immediate refetch whenever the tab/app regains focus (catches
  // it the moment someone switches back, without waiting for the next poll
  // tick). Both call the silent variant so a join updates MemberList
  // quietly instead of bouncing the page back to a loading spinner.
  useEffect(() => {
    const interval = setInterval(() => loadAll(true), 20000);
    function handleVisibility() {
      if (document.visibilityState === 'visible') loadAll(true);
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [loadAll]);

  async function handleAddTask(text) {
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      text,
      completed: false,
      created_by: null,
      assigned_to: null,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [optimistic, ...prev]);
    try {
      const saved = await createGroupTask(stackId, text);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
    } catch (err) {
      console.warn('Failed to add group task:', err.message);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  async function handleToggleTask(task) {
    const nextCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)));
    try {
      await updateGroupTask(stackId, task.id, { completed: nextCompleted });
    } catch (err) {
      console.warn('Failed to update group task:', err.message);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const updated = await updateGroupStack(stackId, { image: file });
      setStack(updated);
    } catch (err) {
      console.warn('Failed to update group stack photo:', err.message);
      setPhotoError(err.message || 'Failed to update photo.');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleDeleteTask(id) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteGroupTask(stackId, id);
    } catch (err) {
      console.warn('Failed to delete group task:', err.message);
      setTasks(previous);
    }
  }

  async function handleNudgeSelect(username) {
    if (!nudgeTask) return;
    const taskId = nudgeTask.id;
    try {
      const updated = await nudgeGroupTask(stackId, taskId, username);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.warn('Failed to nudge task:', err.message);
    } finally {
      setNudgeTask(null);
    }
  }

  async function handleLeave() {
    const confirmText = t('groups.groupStackDetail.leaveConfirm', {
      name: stack?.name || t('groups.groupStackDetail.leaveConfirmFallbackName'),
    });
    if (!window.confirm(confirmText)) return;
    setLeaving(true);
    try {
      await leaveGroupStack(stackId);
      navigate('/stacks');
    } catch (err) {
      console.warn('Failed to leave group stack:', err.message);
      setLeaving(false);
    }
  }

  const activeTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={`text-title ${styles.title}`}>{stack ? stack.name : t('groups.groupStackDetail.fallbackHeading')}</h1>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <LoadingSpinner />
        </div>
      ) : loadError ? (
        <div className={styles.emptyState}>
          <p className={`text-body-strong ${styles.emptyTitle}`}>{t('groups.groupStackDetail.couldNotLoad')}</p>
          <p className={`text-small ${styles.emptySubtitle}`}>{loadError}</p>
        </div>
      ) : (
        <>
          <div className={styles.photoRow}>
            <div className={styles.photoShell}>
              <Avatar uri={stack?.image} label={stack?.name} size={56} />
              <button
                type="button"
                className={styles.photoEditBadge}
                onClick={() => photoInputRef.current?.click()}
                aria-label={t('groups.groupStackDetail.changePhotoAria')}
                disabled={photoUploading}
              >
                <Camera size={12} strokeWidth={2.5} />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className={styles.photoHiddenInput}
                onChange={handlePhotoChange}
                disabled={photoUploading}
              />
            </div>
            <div className={styles.membersWrap}>
              <MemberList
                members={stack?.members || []}
                stackId={stackId}
                inviteOpen={showInviteForm}
                onToggleInvite={() => setShowInviteForm((prev) => !prev)}
              />
            </div>
          </div>
          {photoError && <p className={`text-small ${styles.photoErrorText}`}>{photoError}</p>}

          <AnimatePresence initial={false}>
            {showInviteForm && <InviteCard stackId={stackId} />}
          </AnimatePresence>

          <GroupTaskInput onSubmit={handleAddTask} />

          <div className={styles.taskList}>
            {tasks.length === 0 ? (
              <div className={styles.emptyState}>
                <ClipboardList size={40} strokeWidth={1.5} className={styles.emptyIcon} />
                <p className={`text-body-strong ${styles.emptyTitle}`}>{t('groups.groupStackDetail.emptyNoTasksTitle')}</p>
                <p className={`text-small ${styles.emptySubtitle}`}>
                  {t('groups.groupStackDetail.emptyNoTasksBody')}
                </p>
              </div>
            ) : activeTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle2 size={40} strokeWidth={1.5} className={styles.emptyIcon} />
                <p className={`text-body-strong ${styles.emptyTitle}`}>{t('groups.groupStackDetail.emptyAllDoneTitle')}</p>
                <p className={`text-small ${styles.emptySubtitle}`}>{t('groups.groupStackDetail.emptyAllDoneBody')}</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {activeTasks.map((task) => (
                  <GroupTaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onNudge={setNudgeTask}
                  />
                ))}
              </AnimatePresence>
            )}

            <GroupDumpSection
              tasks={doneTasks}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onNudge={setNudgeTask}
            />

            <button type="button" className={styles.leaveButton} onClick={handleLeave} disabled={leaving}>
              <LogOut size={14} strokeWidth={2} />
              {leaving ? t('groups.groupStackDetail.leaving') : t('groups.groupStackDetail.leaveButton')}
            </button>
          </div>
        </>
      )}

      <NudgeModal
        task={nudgeTask}
        members={(stack?.members || []).filter((m) => m.id !== nudgeTask?.assigned_to?.id)}
        onSelect={handleNudgeSelect}
        onClose={() => setNudgeTask(null)}
      />
    </div>
  );
}
