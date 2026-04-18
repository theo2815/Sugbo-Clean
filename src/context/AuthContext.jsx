import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DEV_USE_BASIC_AUTH, IS_DEV_PROXY, OAUTH } from '../utils/constants';
import { beginOAuthLogin, completeOAuthLogin, refreshAccessToken } from '../services/oauth';
import { verifyAuth } from '../services/api';

const STORAGE_KEY = 'sc_auth';
// Pre-OAuth key — read once for one-release compatibility, never written.
const LEGACY_BASIC_KEY = 'sc_auth_header';

// Module-level mirror so api.js can read the header synchronously on every request.
let _authHeader = loadHeaderFromStorage();

function loadHeaderFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.kind === 'bearer' && s.accessToken) return `Bearer ${s.accessToken}`;
      if (s.kind === 'basic' && s.header) return s.header;
    }
    const legacy = sessionStorage.getItem(LEGACY_BASIC_KEY);
    if (legacy) return legacy;
  } catch { /* ignore */ }
  return '';
}

export function getAuthHeader() {
  return _authHeader;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
      const legacy = sessionStorage.getItem(LEGACY_BASIC_KEY);
      if (legacy) return { kind: 'basic', header: legacy };
    } catch { /* ignore */ }
    return null;
  });
  const refreshTimerRef = useRef(null);

  const persistSession = useCallback((next) => {
    if (next) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      _authHeader = next.kind === 'bearer' ? `Bearer ${next.accessToken}` : (next.header || '');
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_BASIC_KEY);
      _authHeader = '';
    }
    setSession(next);
  }, []);

  // Refresh the access token ahead of expiry. If refresh fails the session is
  // cleared; the 401 handler in app.jsx will surface a flash + redirect.
  const scheduleRefresh = useCallback((s) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (!s || s.kind !== 'bearer' || !s.refreshToken || !s.expiresAt) return;
    const delay = Math.max(0, s.expiresAt - Date.now() - OAUTH.refreshMarginMs);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const next = await refreshAccessToken(s.refreshToken);
        persistSession({
          kind: 'bearer',
          accessToken: next.accessToken,
          refreshToken: next.refreshToken || s.refreshToken,
          expiresAt: next.expiresAt,
        });
      } catch {
        persistSession(null);
      }
    }, delay);
  }, [persistSession]);

  useEffect(() => {
    scheduleRefresh(session);
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [session, scheduleRefresh]);

  const startLogin = useCallback(() => beginOAuthLogin('/admin/dashboard'), []);

  const completeLogin = useCallback(async ({ code, state }) => {
    const tokens = await completeOAuthLogin({ code, state });
    persistSession({
      kind: 'bearer',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
  }, [persistSession]);

  const loginBasic = useCallback(async (username, password) => {
    if (!DEV_USE_BASIC_AUTH) throw new Error('Basic Auth is disabled in this build.');
    const header = `Basic ${btoa(`${username}:${password}`)}`;
    try {
      await verifyAuth(header);
    } catch (err) {
      if (err.status === 401) throw new Error('Invalid credentials');
      throw new Error(IS_DEV_PROXY ? 'API unreachable. Check the dev server.' : 'Login failed. Please try again.');
    }
    persistSession({ kind: 'basic', header });
  }, [persistSession]);

  const logout = useCallback(() => persistSession(null), [persistSession]);

  const value = {
    isAdmin: !!session,
    sessionKind: session?.kind || null,
    startLogin,
    completeLogin,
    loginBasic,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
