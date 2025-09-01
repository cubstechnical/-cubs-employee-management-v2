'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import AuthService, { AuthUser } from '@/lib/services/auth';
import { getAuthState, clearAuthCache, isSupabaseAvailable } from '@/lib/supabase/client';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isApproved: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: { message: string } | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ user: AuthUser | null; error: { message: string } | null }>;
  signOut: () => Promise<{ error: { message: string } | null }>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  hasPermission: (permission: string) => Promise<boolean>;
  checkApproval: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // Get initial session with robust error handling
    const getInitialSession = async () => {
      try {
        // If Supabase is not available, skip authentication
        if (!isSupabaseAvailable) {
          setSession(null);
          setUser(null);
          setIsApproved(false);
          setLoading(false);
          return;
        }

        // Use cached auth state for faster loading
        const cachedAuth = await getAuthState();
        setSession(cachedAuth.session);

        if (cachedAuth.session) {
          try {
            // Parallel execution for faster loading with timeout
            const [user, approved] = await Promise.all([
              AuthService.getCurrentUser().catch(() => null),
              AuthService.isApproved().catch(() => false)
            ]);
            setUser(user);
            setIsApproved(approved);
          } catch (userError) {
            console.warn('Auth user data fetch failed:', userError);
            // Continue with session but no user data
            setUser(null);
            setIsApproved(false);
          }
        } else {
          setUser(null);
          setIsApproved(false);
        }
      } catch (error) {
        // Clear cache on error
        clearAuthCache();
        // Don't fail completely - allow app to load
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
          try {
            // Parallel execution for faster auth state changes with error handling
            const [user, approved] = await Promise.all([
              AuthService.getCurrentUser().catch(() => null),
              AuthService.isApproved().catch(() => false)
            ]);
            setUser(user);
            setIsApproved(approved);
          } catch (error) {
            console.warn('Auth state change user data fetch failed:', error);
            setUser(null);
            setIsApproved(false);
          }
        } else {
          setUser(null);
          setIsApproved(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [isClient]);

  const signIn = async (email: string, password: string) => {
    const result = await AuthService.signIn({ email, password });
    if (result.user) {
      setUser(result.user);
      // Check approval status after login
      const approved = await AuthService.isApproved();
      setIsApproved(approved);
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

  const checkApproval = async () => {
    const approved = await AuthService.isApproved();
    setIsApproved(approved);
    return approved;
  };

  const value = {
    user,
    session,
    loading,
    isApproved,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasPermission,
    checkApproval,
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