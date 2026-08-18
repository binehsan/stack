import { request } from './client';

// device_id is deliberately omitted — it's an optional field the backend
// uses to enforce a free-tier device cap for mobile installs (see
// backend/accounts/views.py's _register_device_or_reject); a browser
// session isn't a "device" in that sense, so web logins simply skip it.
export function register(email, password, passwordConfirm, username) {
  return request(
    '/auth/register/',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        password_confirm: passwordConfirm,
        username: username || '',
      }),
    },
    { auth: false }
  );
}

export function login(email, password) {
  return request(
    '/auth/login/',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    { auth: false }
  );
}

export function requestPasswordReset(email) {
  return request(
    '/auth/password-reset/',
    { method: 'POST', body: JSON.stringify({ email }) },
    { auth: false }
  );
}

export function confirmPasswordReset(uid, token, newPassword, newPasswordConfirm) {
  return request(
    '/auth/password-reset-confirm/',
    {
      method: 'POST',
      body: JSON.stringify({
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
    },
    { auth: false }
  );
}

export function changePassword(oldPassword, newPassword, newPasswordConfirm) {
  return request('/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    }),
  });
}

export function deleteAccount(password) {
  return request('/auth/delete-account/', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}

export function fetchProfile() {
  return request('/auth/profile/');
}

export function updateProfile(changes) {
  return request('/auth/profile/', {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file, file.name);
  return request('/auth/profile/', {
    method: 'PATCH',
    body: formData,
  });
}
