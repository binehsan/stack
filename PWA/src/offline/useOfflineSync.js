import { useCallback, useEffect, useRef, useState } from 'react';

import { createTask, deleteTask, updateTask } from '../api/tasks';
import { enqueueAction, getQueuedActions, removeQueuedAction } from './queue';

// Drives Dashboard.jsx's offline behavior: queue task actions attempted
// while offline instead of rolling them back, then replay the queue the
// moment the browser reports connectivity again. Exposes `queueAction` for
// Dashboard's catch blocks to call, `pendingCount` for a small "N changes
// waiting to sync" indicator, and `tempIdMap` so a task created offline
// (still carrying its temporary `temp-...` id) resolves to its real
// server-assigned id once synced, without the row losing its identity
// mid-sync (see Dashboard.jsx's `localId` pattern, same idea here).
export function useOfflineSync({ onSynced }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  // Guards against replayQueue running concurrently with itself. It's
  // triggered both on mount (if already online) and on every 'online'
  // window event, and flaky connections can fire several 'online' events in
  // quick succession — without this, two overlapping calls can both read
  // the same still-queued 'create' action before either removes it,
  // creating the task twice server-side. A ref (not state) because the
  // check-and-set has to be synchronous within one JS turn; state updates
  // are too late to prevent the second call's read.
  const replayingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const queued = await getQueuedActions();
    setPendingCount(queued.length);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const queueAction = useCallback(
    async (action) => {
      await enqueueAction(action);
      await refreshPendingCount();
    },
    [refreshPendingCount]
  );

  const replayQueue = useCallback(async () => {
    // Re-entrancy guard: mount and every 'online' event can each call this,
    // and both checking getQueuedActions() and clearing a processed action
    // are async, so two overlapping runs can otherwise both see the same
    // queued action before either removes it. Bail out immediately (rather
    // than queueing/waiting) — whichever call is already in flight will
    // pick up anything still queued by the time it finishes.
    if (replayingRef.current) return;
    replayingRef.current = true;

    try {
      const queued = await getQueuedActions();
      if (queued.length === 0) return;

      setSyncing(true);
      // Oldest first — a 'create' has to run before a 'toggle'/'delete' that
      // targets the temp id it produces.
      queued.sort((a, b) => a.queuedAt - b.queuedAt);

      const tempIdMap = {};
      function resolveId(id) {
        return tempIdMap[id] ?? id;
      }

      for (const action of queued) {
        try {
          if (action.type === 'create') {
            const created = await createTask(action.payload.text);
            tempIdMap[action.payload.tempId] = created.id;
          } else if (action.type === 'toggle') {
            await updateTask(resolveId(action.payload.id), { completed: action.payload.completed });
          } else if (action.type === 'toggleStar') {
            await updateTask(resolveId(action.payload.id), { starred: action.payload.starred });
          } else if (action.type === 'delete') {
            const realId = resolveId(action.payload.id);
            // The task itself may never have made it to the server (created
            // and deleted, both offline, in the same session) — nothing to
            // delete server-side in that case, not an error.
            if (!tempIdMap[action.payload.id] && String(action.payload.id).startsWith('temp-')) {
              continue;
            }
            await deleteTask(realId);
          }
          await removeQueuedAction(action.id);
        } catch (err) {
          // A real (non-network) failure replaying one action — stop here
          // rather than risk applying later actions out of order against a
          // task state that's now diverged from what was queued. Whatever's
          // left in the queue tries again on the next 'online' event.
          console.warn('Failed to replay offline action:', err.message);
          break;
        }
      }

      setSyncing(false);
      await refreshPendingCount();
      onSynced?.();
    } finally {
      replayingRef.current = false;
    }
  }, [refreshPendingCount, onSynced]);

  useEffect(() => {
    if (navigator.onLine) replayQueue();
    window.addEventListener('online', replayQueue);
    return () => window.removeEventListener('online', replayQueue);
  }, [replayQueue]);

  return { queueAction, pendingCount, syncing };
}
