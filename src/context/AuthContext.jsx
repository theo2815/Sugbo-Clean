import React, { createContext, useContext, useState } from 'react';
import { IS_DEV_PROXY } from '../utils/constants';
import { verifyAuth } from '../services/api';

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

    try {
      await verifyAuth(header);
    } catch (err) {
      if (err.status === 401) throw new Error('Invalid credentials');
      throw new Error(IS_DEV_PROXY ? 'API unreachable. Check the dev server.' : 'Login failed. Please try again.');
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
