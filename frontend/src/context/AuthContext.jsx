import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser, updateCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('food_quality_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('food_quality_token');
  });

  // Optimize initial loading state:
  // - If no token exists: false (instant login view, no loading spinner flicker)
  // - If token AND cached user exist: false (instant dashboard access on page refresh)
  // - Only true if token exists without cached profile
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return false;
    const storedToken = localStorage.getItem('food_quality_token');
    const storedUser = localStorage.getItem('food_quality_user');
    if (!storedToken) return false;
    if (storedToken && storedUser) return false;
    return true;
  });

  // Validate existing token with backend on initial mount
  useEffect(() => {
    let isMounted = true;

    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem('food_quality_token');
      if (storedToken) {
        try {
          const profile = await getCurrentUser();
          if (isMounted) {
            setUser(profile);
            localStorage.setItem('food_quality_user', JSON.stringify(profile));
          }
        } catch (err) {
          // Only invalidate credentials if the server explicitly rejects the token (401 or 403)
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            console.warn('Stored token is invalid or expired (401/403):', err.message);
            if (isMounted) {
              localStorage.removeItem('food_quality_token');
              localStorage.removeItem('food_quality_user');
              setToken(null);
              setUser(null);
            }
          } else {
            // Server cold start, transient network error, or offline:
            // Retain the cached session so page refreshes don't kick the user out
            console.warn('Backend verification temporarily unavailable, retaining cached session:', err.message);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    verifyStoredToken();

    // Listen for 401 unauthorized events from Axios interceptor
    const handleUnauthorized = () => {
      if (isMounted) {
        localStorage.removeItem('food_quality_token');
        localStorage.removeItem('food_quality_user');
        setUser(null);
        setToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await loginUser({ email, password });
    localStorage.setItem('food_quality_token', data.access_token);
    localStorage.setItem('food_quality_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const data = await registerUser({ name, email, password });
    localStorage.setItem('food_quality_token', data.access_token);
    localStorage.setItem('food_quality_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
    return data;
  }, []);

  const updateProfile = useCallback(async ({ name }) => {
    const updated = await updateCurrentUser({ name });
    setUser(updated);
    localStorage.setItem('food_quality_user', JSON.stringify(updated));
    return updated;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('food_quality_token');
    localStorage.removeItem('food_quality_user');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
