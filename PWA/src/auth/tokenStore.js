// Web equivalent of the mobile app's auth/tokenStore.js (expo-secure-store
// backed) — localStorage instead, since there's no OS keychain in a
// browser. Tokens are still JWTs scoped to this origin only.
const ACCESS_KEY = 'stack_access_token';
const REFRESH_KEY = 'stack_refresh_token';

export function loadTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
