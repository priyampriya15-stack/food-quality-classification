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
  const [token, setToken] = useState(() => localStorage.getItem('food_quality_token'));
  const [loading, setLoading] = useState(true);

  // Validate existing token with backend on initial mount
  useEffect(() => {
    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem('food_quality_token');
      if (storedToken) {
        try {
          const profile = await getCurrentUser();
          setUser(profile);
          localStorage.setItem('food_quality_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Stored token is invalid or expired:', err.message);
          localStorage.removeItem('food_quality_token');
          localStorage.removeItem('food_quality_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyStoredToken();

    // Listen for 401 unauthorized events from Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
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
