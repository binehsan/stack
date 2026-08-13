import { API_BASE_URL } from './config';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokenStore';

// Called when a refresh attempt itself fails (refresh token expired/invalid),
// so the app can drop back to the login screen. Wired up by AuthProvider.
let onSessionExpired = null;
export function setOnSessionExpired(fn) {
  onSessionExpired = fn;
}

// Concurrent 401s (e.g. several requests in flight when the access token
// expires) should trigger exactly one refresh call, not one per request.
let refreshPromise = null;

// DRF errors show up either as {"detail": "..."} (auth/permission errors) or
// {"field_name": ["message"]} (serializer validation errors) — normalize
// both into a single readable string for the UI.
function extractErrorMessage(body, fallback) {
  if (!body) return fallback;
  if (typeof body.detail === 'string') return body.detail;
  const firstKey = Object.keys(body)[0];
  const value = firstKey && body[firstKey];
  const message = Array.isArray(value) ? value[0] : value;
  return typeof message === 'string' ? message : fallback;
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token available');

  const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) throw new Error('Refresh failed');

  const data = await response.json();
  await setTokens({ access: data.access, refresh: data.refresh ?? refresh });
  return data.access;
}

export async function request(path, options = {}, { auth = true, retry = true } = {}) {
  // FormData (avatar uploads) must NOT get a manual Content-Type — fetch
  // sets multipart/form-data with the correct boundary itself.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && auth && retry) {
    try {
      refreshPromise = refreshPromise || refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
      return request(path, options, { auth, retry: false });
    } catch (err) {
      await clearTokens();
      onSessionExpired?.();
      throw new Error('Your session expired — please log in again.');
    }
  }

  if (!response.ok) {
    const fallback = `Request to ${path} failed with status ${response.status}`;
    let body;
    try {
      body = await response.json();
    } catch {
      // response wasn't JSON — fall through to the generic message below
    }
    throw new Error(extractErrorMessage(body, fallback));
  }

  if (response.status === 204) return null;
  return response.json();
}
