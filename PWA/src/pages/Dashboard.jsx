import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ClipboardList, CloudOff, RefreshCw, Sun } from 'lucide-react';

import IconButton from '../components/IconButton';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskInput from '../components/dashboard/TaskInput';
import FocusSection from '../components/dashboard/FocusSection';
import TaskList from '../components/dashboard/TaskList';
import DumpSection from '../components/dashboard/DumpSection';
import RecapModal from '../components/dashboard/RecapModal';
import CarryForwardModal from '../components/dashboard/CarryForwardModal';
import { useOfflineSync } from '../offline/useOfflineSync';
import {
  createTask,
  deleteTask,
  fetchCarryForwardCandidates,
  fetchRecap,
  fetchTasks,
  reorderTasks,
  submitCarryForward,
  updateTask,
} from '../api/tasks';
import styles from './Dashboard.module.css';

// localStorage counterpart of the mobile app's SecureStore-backed
// RECAP_SHOWN_KEY (frontend/src/screens/HomeScreen.js) — same "once per
// calendar day" gate, just a browser-appropriate storage API.
const RECAP_SHOWN_KEY = 'stack_recap_shown_date';
const MAX_FOCUS_STARS = 3;
// How long a freshly-completed task lingers in the active list (showing its
// strike-through) before sliding into the Dump. Matches TaskItem's 320ms
// strike-through duration, same as the mobile app's HomeScreen.js.
const DUMP_DELAY_MS = 320;

// The core "My Stack" experience: fetch tasks on mount, then everything is
// optimistic local state synced to the backend in the background, with
// rollback on failure — same data flow as frontend/src/screens/HomeScreen.js.
export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [justCompletedIds, setJustCompletedIds] = useState(() => new Set());
  const dumpTimers = useRef({});
  const reorderCommitTimer = useRef(null);

  const [recap, setRecap] = useState(null);
  const [showRecap, setShowRecap] = useState(false);
  const [carryCandidates, setCarryCandidates] = useState([]);
  const [showCarryForward, setShowCarryForward] = useState(false);

  const { queueAction, pendingCount } = useOfflineSync({
    onSynced: () => fetchTasks().then(setTasks).catch(() => {}),
  });

  const loadCarryForward = useCallback(async () => {
    try {
      const candidates = await fetchCarryForwardCandidates();
      if (candidates.length > 0) {
        setCarryCandidates(candidates);
        setShowCarryForward(true);
      }
    } catch (err) {
      console.warn('Failed to load carry-forward candidates:', err.message);
    }
  }, []);

  // Recap and carry-forward both compete for attention on the first open of
  // a new day — show recap first, then the prompt, rather than stacking two
  // modals at once (same ordering as HomeScreen.js on mobile).
  const loadRecapThenCarryForward = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const lastShown = localStorage.getItem(RECAP_SHOWN_KEY);
    let recapShown = false;

    if (lastShown !== today) {
      localStorage.setItem(RECAP_SHOWN_KEY, today);
      try {
        const data = await fetchRecap();
        if (data) {
          setRecap(data);
          setShowRecap(true);
          recapShown = true;
        }
      } catch (err) {
        console.warn('Failed to load recap:', err.message);
      }
    }

    if (!recapShown) loadCarryForward();
  }, [loadCarryForward]);

  function handleRecapClose() {
    setShowRecap(false);
    loadCarryForward();
  }

  async function handleCarryForwardSubmit(ids) {
    setShowCarryForward(false);
    if (ids.length === 0) return;
    try {
      const created = await submitCarryForward(ids);
      setTasks((prev) => [...created, ...prev]);
    } catch (err) {
      console.warn('Failed to carry tasks forward:', err.message);
    }
  }

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch((err) => console.warn('Failed to load tasks:', err.message))
      .finally(() => setLoading(false));

    loadRecapThenCarryForward();

    const timers = dumpTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
      clearTimeout(reorderCommitTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile refetches on every screen focus (React Navigation's
  // useFocusEffect in HomeScreen.js); a browser tab has no such lifecycle
  // event while it just sits open, so without this, reordering (or
  // anything else) on another device wouldn't show up here until a manual
  // refresh or a route change remounted the page. This is the web
  // equivalent — refetch whenever the tab regains visibility.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') handleRefresh();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      setTasks(await fetchTasks());
    } catch (err) {
      console.warn('Failed to refresh:', err.message);
    } finally {
      setRefreshing(false);
    }
  }

  // Optimistic UI throughout: every action updates local state immediately,
  // then syncs to the backend in the background, rolling back on failure.

  async function handleAdd(text) {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      id: tempId,
      // Stays constant across the optimistic->real swap below, unlike `id`.
      // TaskList/DumpSection key rows on this so a row keeps its identity
      // (and doesn't replay its entrance animation) once the server responds.
      localId: tempId,
      text,
      completed: false,
      starred: false,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const saved = await createTask(text);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? { ...saved, localId: tempId } : t)));
    } catch (err) {
      if (err.isNetworkError) {
        // Leave the optimistic row as-is — it stays visible, just queued —
        // instead of the usual rollback-on-failure. useOfflineSync's replay
        // resolves this temp id to a real one once back online.
        await queueAction({ type: 'create', payload: { tempId, text } });
        return;
      }
      console.warn('Failed to add task:', err.message);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  }

  function clearDumpTimer(id) {
    if (dumpTimers.current[id]) {
      clearTimeout(dumpTimers.current[id]);
      delete dumpTimers.current[id];
    }
  }

  async function handleToggle(task) {
    const nextCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t)));

    clearDumpTimer(task.id);
    if (nextCompleted) {
      // Stay visible in the active list just long enough to show the
      // strike-through animation, then drop into the Dump.
      setJustCompletedIds((prev) => new Set(prev).add(task.id));
      dumpTimers.current[task.id] = setTimeout(() => {
        setJustCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
        delete dumpTimers.current[task.id];
      }, DUMP_DELAY_MS);
    } else {
      // Un-completing from the Dump — reappear in the active list immediately.
      setJustCompletedIds((prev) => {
        if (!prev.has(task.id)) return prev;
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }

    try {
      await updateTask(task.id, { completed: nextCompleted });
    } catch (err) {
      if (err.isNetworkError) {
        await queueAction({ type: 'toggle', payload: { id: task.id, completed: nextCompleted } });
        return;
      }
      console.warn('Failed to update task:', err.message);
      clearDumpTimer(task.id);
      setJustCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  }

  async function handleToggleStar(task) {
    const nextStarred = !task.starred;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, starred: nextStarred } : t)));

    try {
      await updateTask(task.id, { starred: nextStarred });
    } catch (err) {
      if (err.isNetworkError) {
        await queueAction({ type: 'toggleStar', payload: { id: task.id, starred: nextStarred } });
        return;
      }
      console.warn('Failed to update focus star:', err.message);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, starred: task.starred } : t)));
    }
  }

  // Mirrors frontend/src/screens/HomeScreen.js's handleReorder: TaskList's
  // Reorder.Group only knows about the active subset it was given, so the
  // reordered ids get merged back against the full `tasks` state (active
  // tasks take the new order, everything else — Dump — keeps its position).
  // Fires on every intermediate drag step, so the actual persist call is
  // debounced rather than sent per step; optimistic tasks (not yet saved,
  // still carrying a `temp-...` id) are dropped from that call since the
  // backend only knows real ids.
  function handleReorder(orderedTasks) {
    setTasks((prev) => {
      const byId = new Map(prev.map((t) => [String(t.id), t]));
      const reorderedActive = orderedTasks.map((t) => byId.get(String(t.id))).filter(Boolean);
      const reorderedIdSet = new Set(orderedTasks.map((t) => String(t.id)));
      const rest = prev.filter((t) => !reorderedIdSet.has(String(t.id)));
      return [...reorderedActive, ...rest];
    });

    clearTimeout(reorderCommitTimer.current);
    reorderCommitTimer.current = setTimeout(() => {
      const ids = orderedTasks.filter((t) => typeof t.id === 'number').map((t) => t.id);
      if (ids.length === 0) return;
      reorderTasks(ids).catch((err) => console.warn('Failed to save new order:', err.message));
    }, 400);
  }

  async function handleDelete(id) {
    const previousTasks = tasks;
    clearDumpTimer(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTask(id);
    } catch (err) {
      if (err.isNetworkError) {
        await queueAction({ type: 'delete', payload: { id } });
        return;
      }
      console.warn('Failed to delete task:', err.message);
      setTasks(previousTasks);
    }
  }

  const starredCount = useMemo(() => tasks.filter((t) => t.starred).length, [tasks]);
  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.completed || justCompletedIds.has(t.id)),
    [tasks, justCompletedIds]
  );
  const doneTasks = useMemo(
    () => tasks.filter((t) => t.completed && !justCompletedIds.has(t.id)),
    [tasks, justCompletedIds]
  );
  const starProps = { onToggleStar: handleToggleStar, starDisabled: starredCount >= MAX_FOCUS_STARS };
  const hasNoTasksAtAll = !loading && tasks.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.headerTitleGroup}>
          <h1 className="text-header">My Stack</h1>
          {pendingCount > 0 && (
            <span className={styles.pendingBadge} title="Changes will finish syncing once you're back online">
              <CloudOff size={13} strokeWidth={2.25} />
              {pendingCount} pending
            </span>
          )}
        </div>
        <IconButton label="Refresh tasks" onClick={handleRefresh} disabled={refreshing} size={36}>
          <motion.span
            animate={{ rotate: refreshing ? 360 : 0 }}
            transition={
              refreshing
                ? { duration: 0.7, repeat: Infinity, ease: 'linear' }
                : { duration: 0 }
            }
            className={styles.refreshIcon}
          >
            <RefreshCw size={16} />
          </motion.span>
        </IconButton>
      </div>

      <TaskInput onSubmit={handleAdd} />

      {loading && (
        <div className={styles.loadingState}>
          <LoadingSpinner />
        </div>
      )}

      {!loading && (
        <div className={styles.listArea}>
          {hasNoTasksAtAll ? (
            <div className={styles.emptyState}>
              <ClipboardList size={40} strokeWidth={1.5} className={styles.emptyIcon} />
              <p className="text-body-strong">Nothing here yet</p>
              <p className={`text-small text-muted ${styles.emptySubtitle}`}>
                Add your first task above to start today&rsquo;s stack.
              </p>
            </div>
          ) : (
            <>
              <FocusSection tasks={tasks} onToggle={handleToggle} />
              <TaskList
                tasks={activeTasks}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onReorder={handleReorder}
                {...starProps}
                EmptyIcon={doneTasks.length > 0 ? CheckCircle2 : Sun}
                emptyTitle={doneTasks.length > 0 ? 'All done for today' : undefined}
                emptySubtitle={
                  doneTasks.length > 0 ? 'Everything you added is in the Dump below.' : undefined
                }
              />
              <DumpSection tasks={doneTasks} onToggle={handleToggle} onDelete={handleDelete} {...starProps} />
            </>
          )}
        </div>
      )}

      <RecapModal visible={showRecap} recap={recap} onClose={handleRecapClose} />
      <CarryForwardModal
        visible={showCarryForward}
        candidates={carryCandidates}
        onSubmit={handleCarryForwardSubmit}
      />
    </div>
  );
}
