import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('examly_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('examly_token')));

  const clearAuth = useCallback(() => {
    localStorage.removeItem('examly_token');
    localStorage.removeItem('examly_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('examly_token');
    if (!token) { setLoading(false); return undefined; }
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('examly_user', JSON.stringify(data.user));
      })
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
    return undefined;
  }, [clearAuth]);

  useEffect(() => {
    const handleUnauthorized = () => clearAuth();
    window.addEventListener('examly:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('examly:unauthorized', handleUnauthorized);
  }, [clearAuth]);

  const acceptAuth = useCallback((data) => {
    localStorage.setItem('examly_token', data.access_token);
    localStorage.setItem('examly_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return acceptAuth(data);
  }, [acceptAuth]);

  const register = useCallback(async (details) => {
    const { data } = await api.post('/auth/register', details);
    return acceptAuth(data);
  }, [acceptAuth]);

  const logout = useCallback(() => clearAuth(), [clearAuth]);
  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
