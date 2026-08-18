import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '../api/auth';
import { setOnSessionExpired } from '../api/client';
import { clearTokens, loadTokens, setTokens } from './tokenStore';
import { decodeJwtUserId } from './jwt';

// Web equivalent of frontend/src/auth/AuthContext.js — same shape
// (isReady/isAuthenticated/login/register/logout/changePassword/
// deleteAccount) so pages ported from mobile screens need no rewiring.
// Deliberately drops guest mode: that's a mobile-only concept (device-local
// tasks that later import into a real account) with no web equivalent —
// the website always requires an account to reach the dashboard.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const { accessToken } = loadTokens();
    setIsAuthenticated(Boolean(accessToken));
    setUserId(decodeJwtUserId(accessToken));
    setEmail(localStorage.getItem('stack_user_email'));
    setIsReady(true);
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => setIsAuthenticated(false));
  }, []);

  const login = useCallback(async (loginEmail, password) => {
    const data = await authApi.login(loginEmail, password);
    setTokens({ access: data.access, refresh: data.refresh });
    localStorage.setItem('stack_user_email', data.email);
    setEmail(data.email);
    setUserId(decodeJwtUserId(data.access));
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (registerEmail, password, passwordConfirm, username) => {
    const data = await authApi.register(registerEmail, password, passwordConfirm, username);
    setTokens({ access: data.access, refresh: data.refresh });
    localStorage.setItem('stack_user_email', data.email);
    setEmail(data.email);
    setUserId(decodeJwtUserId(data.access));
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    localStorage.removeItem('stack_user_email');
    setEmail(null);
    setUserId(null);
    setIsAuthenticated(false);
  }, []);

  const changePassword = useCallback(
    (oldPassword, newPassword, newPasswordConfirm) =>
      authApi.changePassword(oldPassword, newPassword, newPasswordConfirm),
    []
  );

  const deleteAccount = useCallback(async (password) => {
    await authApi.deleteAccount(password);
    clearTokens();
    localStorage.removeItem('stack_user_email');
    setEmail(null);
    setUserId(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated,
      email,
      userId,
      login,
      register,
      logout,
      changePassword,
      deleteAccount,
    }),
    [isReady, isAuthenticated, email, userId, login, register, logout, changePassword, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
