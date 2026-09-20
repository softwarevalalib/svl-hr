import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const applyPayload = useCallback((data) => {
    setUser(data.user || null);
    setRoles(data.roles || []);
    setPermissions(data.permissions || []);
    localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
    localStorage.setItem('roles', JSON.stringify(data.roles || []));
    if (data.user?.username) localStorage.setItem('username', data.user.username);
    if (data.user?.user_level) localStorage.setItem('user_level', data.user.user_level);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setLoading(false);
      return null;
    }
    try {
      const data = await authService.me();
      if (data.success) {
        applyPayload(data);
        return data;
      }
    } catch (e) {
      if (e.response?.status === 401) {
        authService.logout();
        setUser(null);
        setRoles([]);
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, [applyPayload]);

  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password);
    applyPayload(data);
    setLoading(false);
    return data;
  }, [applyPayload]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setRoles([]);
    setPermissions([]);
  }, []);

  const hasPermission = useCallback(
    (code) => {
      if (!code) return true;
      if (Array.isArray(code)) return code.some((c) => permissions.includes(c));
      return permissions.includes(code);
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (codes) => (codes || []).every((c) => permissions.includes(c)),
    [permissions]
  );

  useEffect(() => {
    refreshMe();
    const onFocus = () => refreshMe();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(refreshMe, 30000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      user,
      roles,
      permissions,
      loading,
      login,
      logout,
      refreshMe,
      hasPermission,
      hasAllPermissions,
      isAuthenticated: !!localStorage.getItem('token') && !!user,
      primaryRole: roles[0]?.name || user?.user_level || 'User',
    }),
    [user, roles, permissions, loading, login, logout, hasPermission, hasAllPermissions, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
