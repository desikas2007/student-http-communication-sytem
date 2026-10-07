import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { clearAuthToken, getAuthToken, setAuthToken } from '../services/api';

/**
 * Authentication state for the whole application.
 *
 * The JWT is stored in localStorage (remember me) or sessionStorage and is
 * sent with every request by the Axios interceptor in services/api.js.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Restores a session on hard refresh by calling GET /api/auth/me. */
  useEffect(() => {
    let mounted = true;

    const restore = async () => {
      const token = getAuthToken();
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const data = await authService.fetchCurrentUser();
        if (mounted) setUser(data.data.student);
      } catch {
        // Expired or invalid token -> drop it so ProtectedRoute redirects.
        clearAuthToken();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    restore();
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * POST /api/auth/login - resolves with the server response or throws an
   * error carrying status / errorCode for the login form to display.
   */
  const login = useCallback(async (email, password, remember = true) => {
    const data = await authService.login(email, password);
    setAuthToken(data.token, remember);
    setUser(data.student);
    return data;
  }, []);

  /** POST /api/auth/logout then clear the local session. */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logging out locally must succeed even if the server is unreachable.
    } finally {
      clearAuthToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser: async () => {
        const data = await authService.fetchCurrentUser();
        setUser(data.data.student);
        return data.data.student;
      },
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>');
  return context;
};

export default AuthContext;
