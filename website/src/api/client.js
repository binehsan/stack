import { API_BASE_URL } from './config';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokenStore';

// Ported from frontend/src/api/client.js — same refresh-on-401,
// single-flight-refresh, and DRF error-shape normalization, swapping
// SecureStore for localStorage (see auth/tokenStore.js).
let onSessionExpired = null;
export function setOnSessionExpired(fn) {
  onSessionExpired = fn;
}

let refreshPromise = null;

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
  setTokens({ access: data.access, refresh: data.refresh ?? refresh });
  return data.access;
}

export async function request(path, options = {}, { auth = true, retry = true } = {}) {
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
    } catch {
      clearTokens();
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
      // not JSON — fall through to the generic message
    }
    const error = new Error(extractErrorMessage(body, fallback));
    error.status = response.status;
    if (body && typeof body.code === 'string') error.code = body.code;
    if (body && typeof body.reset_at === 'string') error.resetAt = body.reset_at;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}
