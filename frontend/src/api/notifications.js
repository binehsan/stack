import { request } from './client';

export function registerPushToken(token) {
  return request('/auth/push-token/', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
