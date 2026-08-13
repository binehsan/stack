import AsyncStorage from '@react-native-async-storage/async-storage';

// Guest mode's task store: everything HomeScreen needs, kept entirely on
// the device (no backend involved) so the app is usable without an
// account. Deliberately mirrors api/tasks.js's function signatures
// (fetchTasks/createTask/updateTask/deleteTask/reorderTasks) so HomeScreen
// can swap between the two without any other changes — see HomeScreen.js's
// `tasksApi` selection.
const STORAGE_KEY = 'stack_guest_tasks';

// Guest mode has no per-user Profile.reset_hour to compute "today" against
// (see backend/tasks/views.py get_today_range()) — it's always local
// midnight to midnight. This is a deliberate simplification, not an
// oversight: a guest who wants a custom reset hour needs an account anyway.
function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function readAll() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeAll(tasks) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function fetchTasks() {
  const all = await readAll();
  const { start, end } = todayRange();
  return all
    .filter((t) => {
      const created = new Date(t.created_at);
      return created >= start && created < end;
    })
    .sort((a, b) => a.order - b.order || new Date(b.created_at) - new Date(a.created_at));
}

export async function createTask(text) {
  const all = await readAll();
  const task = {
    id: makeId(),
    text,
    completed: false,
    starred: false,
    order: 0,
    created_at: new Date().toISOString(),
  };
  await writeAll([task, ...all]);
  return task;
}

export async function updateTask(id, changes) {
  const all = await readAll();
  let updated = null;
  const next = all.map((t) => {
    if (t.id !== id) return t;
    updated = { ...t, ...changes };
    return updated;
  });
  await writeAll(next);
  return updated;
}

export async function deleteTask(id) {
  const all = await readAll();
  await writeAll(all.filter((t) => t.id !== id));
  return null;
}

export async function reorderTasks(taskIds) {
  const all = await readAll();
  const orderById = new Map(taskIds.map((id, index) => [String(id), index]));
  const next = all.map((t) =>
    orderById.has(String(t.id)) ? { ...t, order: orderById.get(String(t.id)) } : t
  );
  await writeAll(next);
  return null;
}

// Guest-only helpers (not part of api/tasks.js's shape) — used by the
// import-on-signup flow in AuthContext.
export async function readAllLocalTasks() {
  return readAll();
}

export async function clearLocalTasks() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
