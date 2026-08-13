import { request } from './client';

export function fetchTasks() {
  return request('/tasks/');
}

export function createTask(text) {
  return request('/tasks/', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function updateTask(id, changes) {
  return request(`/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function deleteTask(id) {
  return request(`/tasks/${id}/`, {
    method: 'DELETE',
  });
}

export function reorderTasks(taskIds) {
  return request('/tasks/reorder/', {
    method: 'POST',
    body: JSON.stringify({ task_ids: taskIds }),
  });
}

// Recap for the most recent past day, or null if there's nothing to recap
// (e.g. first day using the app, or already-empty yesterday).
export function fetchRecap() {
  return request('/tasks/recap/');
}

export function fetchCarryForwardCandidates() {
  return request('/tasks/carry-forward-candidates/');
}

export function submitCarryForward(taskIds) {
  return request('/tasks/carry-forward/', {
    method: 'POST',
    body: JSON.stringify({ task_ids: taskIds }),
  });
}

export function fetchSuggestions() {
  return request('/tasks/suggestions/');
}

export function fetchStats() {
  return request('/tasks/stats/');
}
