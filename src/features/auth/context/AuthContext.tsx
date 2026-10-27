'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, LoginPayload, RegisterPayload } from '@/features/auth/types/user';
import { authService } from '@/features/auth/services/authService';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { isAdminRole } from '@/features/auth/utils/authorization';

interface AuthContextType {
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  resetPasswordEmail: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 menit
const LAST_ACTIVITY_KEY = 'pegadaian_last_activity_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await authService.getUserProfile(uid);
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isFirebaseConfigured) {
      if (auth) {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            await fetchProfile(firebaseUser.uid);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
      } else {
        console.error('Firebase is configured but Authentication failed to initialize.');
        setUserProfile(null);
        setLoading(false);
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // Local Mode Session Check
      const session = authService.getCurrentSession();
      setUserProfile(session);
      setLoading(false);
    } else {
      setUserProfile(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Inactivity Auto-Logout (30 Menit Silent Background Listener)
  useEffect(() => {
    if (!userProfile) return;

    const updateActivity = () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
    };

    updateActivity();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    let lastRecorded = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 5000) {
        lastRecorded = now;
        updateActivity();
      }
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    const checkInterval = setInterval(async () => {
      if (!userProfile) return;

      const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        console.warn('Session expired due to 30 minutes of inactivity. Logging out...');
        await logout();
      }
    }, 10000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(checkInterval);
    };
  }, [userProfile]);

  const refreshUserProfile = async () => {
    if (userProfile?.uid) {
      await fetchProfile(userProfile.uid);
    }
  };

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

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUserProfile(null);
  };

  const isAdmin = isAdminRole(userProfile?.role);

  return (
    <AuthContext.Provider value={{
      userProfile,
      isAdmin,
      loading,
      login,
      register,
      resetPasswordEmail,
      refreshUserProfile,
      logout
    }}>
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
