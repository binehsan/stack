import { request } from './client';

// Every stack the current user belongs to — unlike the old single-family-
// stack design, a user can be in any number of these at once.
export function fetchMyGroupStacks() {
  return request('/groups/mine/');
}

export function fetchGroupStack(stackId) {
  return request(`/groups/${stackId}/`);
}

export function createGroupStack(name) {
  return request('/groups/create/', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// `changes.image`, if present, is a local file URI (from expo-image-picker)
// — switches to a multipart body, mirroring api/auth.js's uploadAvatar.
export function updateGroupStack(stackId, changes) {
  const { image, ...rest } = changes;
  if (!image) {
    return request(`/groups/${stackId}/`, {
      method: 'PATCH',
      body: JSON.stringify(rest),
    });
  }

  const filename = image.split('/').pop() || 'stack.jpg';
  const extensionMatch = /\.(\w+)$/.exec(filename);
  const type = extensionMatch ? `image/${extensionMatch[1]}` : 'image/jpeg';

  const formData = new FormData();
  if (rest.name !== undefined) formData.append('name', rest.name);
  formData.append('image', { uri: image, name: filename, type });

  return request(`/groups/${stackId}/`, {
    method: 'PATCH',
    body: formData,
  });
}

export function leaveGroupStack(stackId) {
  return request(`/groups/${stackId}/leave/`, { method: 'POST' });
}

export function fetchGroupInvites() {
  return request('/groups/invites/');
}

export function sendGroupInvite(stackId, username) {
  return request(`/groups/${stackId}/invite/`, {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export function respondToGroupInvite(inviteId, action) {
  return request(`/groups/invites/${inviteId}/respond/`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export function fetchGroupTasks(stackId) {
  return request(`/groups/${stackId}/tasks/`);
}

export function createGroupTask(stackId, text) {
  return request(`/groups/${stackId}/tasks/`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function updateGroupTask(stackId, taskId, changes) {
  return request(`/groups/${stackId}/tasks/${taskId}/`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function deleteGroupTask(stackId, taskId) {
  return request(`/groups/${stackId}/tasks/${taskId}/`, { method: 'DELETE' });
}

export function nudgeGroupTask(stackId, taskId, username) {
  return request(`/groups/${stackId}/tasks/${taskId}/nudge/`, {
    method: 'POST',
    body: JSON.stringify({ username: username || '' }),
  });
}
