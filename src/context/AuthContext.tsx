'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, LoginPayload, RegisterPayload } from '@/types/user';
import { authService } from '@/services/authService';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  resetPasswordEmail: (email: string) => Promise<void>;
  resetPasswordDirectly: (payload: { email: string; newPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const profile = await authService.getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
          } catch (err) {
            console.error('Failed to load user profile:', err);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });
    } else {
      // Local Mode Session Check
      const session = authService.getCurrentSession();
      setUserProfile(session);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (payload: LoginPayload): Promise<UserProfile> => {
    const profile = await authService.login(payload);
    setUserProfile(profile);
    return profile;
  };

  const register = async (payload: RegisterPayload): Promise<UserProfile> => {
    const profile = await authService.register(payload);
    setUserProfile(profile);
    return profile;
  };

  const resetPasswordEmail = async (email: string): Promise<void> => {
    await authService.resetPasswordEmail(email);
  };

  const resetPasswordDirectly = async (payload: { email: string; newPassword: string }): Promise<void> => {
    await authService.resetPasswordDirectly(payload);
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ userProfile, loading, login, register, resetPasswordEmail, resetPasswordDirectly, logout }}>
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
