import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '../types';
import { authAPI } from '../services/api';
import { safeStorage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: (demoEmail: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => safeStorage.getItem('cinematch_token'));

  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = safeStorage.getItem('cinematch_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);

  const clearSession = useCallback(() => {
    safeStorage.removeItem('cinematch_token');
    safeStorage.removeItem('cinematch_user');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchUser = useCallback(async () => {
    const currentToken = safeStorage.getItem('cinematch_token');
    if (!currentToken) {
      clearSession();
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const u = await authAPI.getMe();
      if (u && u.id) {
        setUser(u);
        try {
          safeStorage.setItem('cinematch_user', JSON.stringify(u));
        } catch (e) {}
      } else {
        clearSession();
      }
    } catch (e) {
      clearSession();
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      const userObj: User = {
        id: data.user_id,
        name: data.name,
        email: data.email,
        is_admin: data.is_admin,
        onboarding_completed: data.onboarding_completed,
        created_at: new Date().toISOString()
      };
      safeStorage.setItem('cinematch_token', data.access_token);
      safeStorage.setItem('cinematch_user', JSON.stringify(userObj));
      setToken(data.access_token);
      setUser(userObj);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (demoEmail: string) => {
    const password = demoEmail.includes('admin') ? 'admin123' : 'password123';
    await login(demoEmail, password);
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.register(name, email, password);
      const userObj: User = {
        id: data.user_id,
        name: data.name,
        email: data.email,
        is_admin: data.is_admin,
        onboarding_completed: data.onboarding_completed,
        created_at: new Date().toISOString()
      };
      safeStorage.setItem('cinematch_token', data.access_token);
      safeStorage.setItem('cinematch_user', JSON.stringify(userObj));
      setToken(data.access_token);
      setUser(userObj);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      authAPI.logout();
    } catch (e) {}
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginAsDemo, register, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
