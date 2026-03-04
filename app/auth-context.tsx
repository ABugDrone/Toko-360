'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthSession } from '@/lib/types';
import { getAuthSession, setAuthSession, clearAuthSession, login as storageLogin } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (staffId: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      setUser(session.user);
    }
    setIsLoading(false);
  }, []);

  const login = async (staffId: string, password: string) => {
    // Authenticate with Supabase database
    // Requirement 16.1, 16.2, 16.3, 16.4, 16.6
    if (!staffId || !password) {
      throw new Error('Staff ID and password are required');
    }

    const result = await storageLogin(staffId, password);
    
    if (!result.success) {
      throw new Error(result.error || 'Authentication failed');
    }

    // Update user state - this will trigger re-renders
    setUser(result.user!);
    
    // Return success to allow caller to wait for state propagation
    return result.user!;
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      const session = getAuthSession();
      if (session) {
        setAuthSession({ ...session, user: updated });
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
