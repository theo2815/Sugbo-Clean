import React, { createContext, useContext, useState } from 'react';
import { API, IS_DEV_PROXY } from '../utils/constants';

const SESSION_KEY = 'sc_auth_header';

// Module-level variable for synchronous access from api.js without re-renders.
let _authHeader = sessionStorage.getItem(SESSION_KEY) || '';

export function getAuthHeader() {
  return _authHeader;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => !!sessionStorage.getItem(SESSION_KEY));

  async function login(username, password) {
    const header = `Basic ${btoa(`${username}:${password}`)}`;

    if (IS_DEV_PROXY) {
      // Dev proxy already authenticates as admin — just verify the API is reachable.
      const res = await fetch(`${API.url}/barangays`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('API unreachable. Check the dev server.');
    } else {
      // Production: validate credentials against ServiceNow.
      const res = await fetch(`${API.url}/barangays`, {
        headers: { Authorization: header, Accept: 'application/json' },
      });
      if (res.status === 401) throw new Error('Invalid credentials');
      if (!res.ok) throw new Error('Login failed. Please try again.');
    }

    _authHeader = header;
    sessionStorage.setItem(SESSION_KEY, header);
    setIsAdmin(true);
  }

  function logout() {
    _authHeader = '';
    sessionStorage.removeItem(SESSION_KEY);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
