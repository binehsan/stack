import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ClipboardList, LogOut } from 'lucide-react';

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
  updateGroupTask,
} from '../api/groupStacks';
import styles from './GroupStackDetail.module.css';

// One group stack's detail page — members, invite form, shared task list,
// nudge, and leave. Web counterpart of
// frontend/src/screens/GroupStackDetailScreen.js.
export default function GroupStackDetail() {
  const { stackId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stack, setStack] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadError, setLoadError] = useState(null);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [nudgeTask, setNudgeTask] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [stackData, taskData] = await Promise.all([
        fetchGroupStack(stackId),
        fetchGroupTasks(stackId),
      ]);
      setStack(stackData);
      setTasks(taskData);
    } catch (err) {
      console.warn('Failed to load group stack:', err.message);
      setLoadError(err.message || 'Failed to load this group stack.');
    } finally {
      setLoading(false);
    }
  }, [stackId]);

  useEffect(() => {
    loadAll();
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
    if (!window.confirm(`Leave "${stack?.name || 'this stack'}"?`)) return;
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
        <Link to="/stacks" className={styles.backLink} aria-label="Back to Group Stacks">
          <ChevronLeft size={20} />
        </Link>
        <h1 className={`text-title ${styles.title}`}>{stack ? stack.name : 'Group Stack'}</h1>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <LoadingSpinner />
        </div>
      ) : loadError ? (
        <div className={styles.emptyState}>
          <p className={`text-body-strong ${styles.emptyTitle}`}>Couldn't load this stack</p>
          <p className={`text-small ${styles.emptySubtitle}`}>{loadError}</p>
        </div>
      ) : (
        <>
          <div className={styles.photoRow}>
            <Avatar uri={stack?.image} label={stack?.name} size={56} />
            <div className={styles.membersWrap}>
              <MemberList
                members={stack?.members || []}
                inviteOpen={showInviteForm}
                onToggleInvite={() => setShowInviteForm((prev) => !prev)}
              />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showInviteForm && <InviteCard stackId={stackId} />}
          </AnimatePresence>

          <GroupTaskInput onSubmit={handleAddTask} />

          <div className={styles.taskList}>
            {tasks.length === 0 ? (
              <div className={styles.emptyState}>
                <ClipboardList size={40} strokeWidth={1.5} className={styles.emptyIcon} />
                <p className={`text-body-strong ${styles.emptyTitle}`}>Nothing on this stack yet</p>
                <p className={`text-small ${styles.emptySubtitle}`}>
                  Add something above, or nudge it to someone.
                </p>
              </div>
            ) : activeTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle2 size={40} strokeWidth={1.5} className={styles.emptyIcon} />
                <p className={`text-body-strong ${styles.emptyTitle}`}>All done for now</p>
                <p className={`text-small ${styles.emptySubtitle}`}>Everything's in the Dump below.</p>
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
              {leaving ? 'Leaving…' : 'Leave this stack'}
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
