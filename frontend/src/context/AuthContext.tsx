import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authAPI } from '../services/api';

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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cinematch_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      if (token) {
        const u = await authAPI.getMe();
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Failed to fetch current user session", e);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem('cinematch_token', data.access_token);
      setToken(data.access_token);
      setUser({
        id: data.user_id,
        name: data.name,
        email: data.email,
        is_admin: data.is_admin,
        onboarding_completed: data.onboarding_completed,
        created_at: new Date().toISOString()
      });
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
      localStorage.setItem('cinematch_token', data.access_token);
      setToken(data.access_token);
      setUser({
        id: data.user_id,
        name: data.name,
        email: data.email,
        is_admin: data.is_admin,
        onboarding_completed: data.onboarding_completed,
        created_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setToken(null);
    setUser(null);
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
