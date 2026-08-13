import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import * as authApi from '../api/auth';
import * as tasksApi from '../api/tasks';
import { clearLocalTasks, readAllLocalTasks } from '../api/localTasks';
import { setOnSessionExpired } from '../api/client';
import { clearTokens, loadTokens, setTokens } from './tokenStore';

const EMAIL_KEY = 'stack_user_email';
const GUEST_KEY = 'stack_is_guest';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // isReady gates rendering until we've checked SecureStore for an existing
  // session, so the app never flashes the login screen for an already
  // logged-in user.
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [email, setEmail] = useState(null);
  // Set right after a guest->account conversion imports local tasks, so a
  // screen can show a one-time "N tasks imported" confirmation, then clear
  // it. Not persisted — this is a single-render signal, not app state.
  const [importedTaskCount, setImportedTaskCount] = useState(null);

  useEffect(() => {
    Promise.all([
      loadTokens(),
      SecureStore.getItemAsync(EMAIL_KEY),
      SecureStore.getItemAsync(GUEST_KEY),
    ]).then(([{ accessToken }, storedEmail, guestFlag]) => {
      setIsAuthenticated(Boolean(accessToken));
      setEmail(storedEmail);
      // A stored access token always wins over a stale guest flag.
      setIsGuest(!accessToken && guestFlag === '1');
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => setIsAuthenticated(false));
  }, []);

  // Folds any tasks created in guest mode into the now-real account, then
  // clears local storage — only once every import succeeds, so a failure
  // partway through never silently loses tasks. Swallows its own errors:
  // a failed import must never block login/register itself.
  const importGuestTasksIfAny = useCallback(async () => {
    let localTasks;
    try {
      localTasks = await readAllLocalTasks();
    } catch {
      return;
    }
    if (!localTasks || localTasks.length === 0) return;

    try {
      for (const task of localTasks) {
        const saved = await tasksApi.createTask(task.text);
        const changes = {};
        if (task.completed) changes.completed = true;
        if (task.starred) changes.starred = true;
        if (Object.keys(changes).length > 0) {
          await tasksApi.updateTask(saved.id, changes);
        }
      }
      await clearLocalTasks();
      setImportedTaskCount(localTasks.length);
    } catch (err) {
      console.warn('Failed to import guest tasks:', err.message);
      // Leave local tasks in place on failure — nothing is lost, and
      // they'll be retried next time this runs.
    }
  }, []);

  const exitGuestMode = useCallback(async () => {
    setIsGuest(false);
    await SecureStore.deleteItemAsync(GUEST_KEY);
  }, []);

  const continueAsGuest = useCallback(async () => {
    setIsGuest(true);
    await SecureStore.setItemAsync(GUEST_KEY, '1');
  }, []);

  const login = useCallback(
    async (loginEmail, password) => {
      const data = await authApi.login(loginEmail, password);
      await setTokens({ access: data.access, refresh: data.refresh });
      await SecureStore.setItemAsync(EMAIL_KEY, data.email);
      setEmail(data.email);
      await exitGuestMode();
      await importGuestTasksIfAny();
      setIsAuthenticated(true);
    },
    [exitGuestMode, importGuestTasksIfAny]
  );

  const register = useCallback(
    async (registerEmail, password, passwordConfirm, username) => {
      const data = await authApi.register(registerEmail, password, passwordConfirm, username);
      await setTokens({ access: data.access, refresh: data.refresh });
      await SecureStore.setItemAsync(EMAIL_KEY, data.email);
      setEmail(data.email);
      await exitGuestMode();
      await importGuestTasksIfAny();
      setIsAuthenticated(true);
    },
    [exitGuestMode, importGuestTasksIfAny]
  );

  const logout = useCallback(async () => {
    await clearTokens();
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    setEmail(null);
    setIsAuthenticated(false);
  }, []);

  const changePassword = useCallback(
    (oldPassword, newPassword, newPasswordConfirm) =>
      authApi.changePassword(oldPassword, newPassword, newPasswordConfirm),
    []
  );

  const deleteAccount = useCallback(async (password) => {
    await authApi.deleteAccount(password);
    await clearTokens();
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    setEmail(null);
    setIsAuthenticated(false);
  }, []);

  const clearImportedTaskCount = useCallback(() => setImportedTaskCount(null), []);

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated,
      isGuest,
      email,
      importedTaskCount,
      clearImportedTaskCount,
      continueAsGuest,
      login,
      register,
      logout,
      changePassword,
      deleteAccount,
    }),
    [
      isReady,
      isAuthenticated,
      isGuest,
      email,
      importedTaskCount,
      clearImportedTaskCount,
      continueAsGuest,
      login,
      register,
      logout,
      changePassword,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
