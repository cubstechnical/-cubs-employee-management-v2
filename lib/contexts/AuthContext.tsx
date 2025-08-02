'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import AuthService, { AuthUser } from '@/lib/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: { message: string } | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ user: AuthUser | null; error: { message: string } | null }>;
  signOut: () => Promise<{ error: { message: string } | null }>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  hasPermission: (permission: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const sessionData = await AuthService.getSession();
        setSession(sessionData.session);

        if (sessionData.session) {
          const user = await AuthService.getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session) {
          const user = await AuthService.getCurrentUser();
          setUser(user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await AuthService.signIn({ email, password });
    if (result.user) {
      setUser(result.user);
    }
    return result;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await AuthService.signUp({ email, password, name });
    if (result.user) {
      setUser(result.user);
    }
    return result;
  };

  const signOut = async () => {
    const result = await AuthService.signOut();
    if (!result.error) {
      setUser(null);
      setSession(null);
    }
    return result;
  };

  const resetPassword = async (email: string) => {
    return await AuthService.resetPassword(email);
  };

  const hasPermission = async (permission: string) => {
    return await AuthService.hasPermission(permission);
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 