import { request } from './client';

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

export function uploadAvatar(uri) {
  const filename = uri.split('/').pop() || 'avatar.jpg';
  const extensionMatch = /\.(\w+)$/.exec(filename);
  const type = extensionMatch ? `image/${extensionMatch[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('avatar', { uri, name: filename, type });

  return request('/auth/profile/', {
    method: 'PATCH',
    body: formData,
  });
}
