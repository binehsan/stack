// A small IndexedDB-backed queue for task actions attempted while offline.
// Plain IndexedDB, not a wrapper library — the whole surface needed here is
// "add one, list all, remove one," which isn't worth a dependency for.
//
// Scope, deliberately: task create/toggle-complete/toggle-star/delete only —
// the actions Dashboard.jsx already applies optimistically to local state,
// so queuing just means "don't roll back the optimistic update, try again
// later" instead of "fail and revert." Reordering isn't queued — it depends
// on the final on-screen order at sync time, which optimistic-then-replay
// can't reconstruct correctly, so a reorder made while offline is simply
// not persisted (the list still *looks* reordered locally until next
// refetch) rather than replayed wrong.
const DB_NAME = 'stack-offline';
const STORE_NAME = 'pending-actions';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// `action` shape: { type: 'create' | 'toggle' | 'toggleStar' | 'delete', payload }
// payload varies by type — see useOfflineSync.js's replay switch for exactly
// what each one needs.
export async function enqueueAction(action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ ...action, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedActions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedAction(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
