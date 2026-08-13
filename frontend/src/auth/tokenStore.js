import * as SecureStore from 'expo-secure-store';

// JWTs are sensitive, so they live in SecureStore (Keychain/Keystore-backed),
// not AsyncStorage. This module is the single source of truth for their
// in-memory + persisted values; api/client.js reads from it directly (no
// React) so request headers/refresh logic can't get out of sync with
// whatever AuthContext currently has in state.
const ACCESS_KEY = 'stack_access_token';
const REFRESH_KEY = 'stack_refresh_token';

let accessToken = null;
let refreshToken = null;
let listeners = [];

export async function loadTokens() {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  accessToken = access;
  refreshToken = refresh;
  return { accessToken, refreshToken };
}

export async function setTokens({ access, refresh }) {
  accessToken = access ?? accessToken;
  refreshToken = refresh ?? refreshToken;
  await Promise.all([
    access ? SecureStore.setItemAsync(ACCESS_KEY, access) : Promise.resolve(),
    refresh ? SecureStore.setItemAsync(REFRESH_KEY, refresh) : Promise.resolve(),
  ]);
  notify();
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
  notify();
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener({ accessToken, refreshToken }));
}
