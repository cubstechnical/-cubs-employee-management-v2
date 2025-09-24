'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, type AuthUser } from '@/lib/services/auth'
import { supabase } from '@/lib/supabase/client'
import { handleAuthError, isRefreshTokenError } from '@/lib/utils/authErrorHandler'
import { log } from '@/lib/utils/logger'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load user session from Supabase with enhanced error handling
    const loadSession = async () => {
      try {
        // Add longer timeout for mobile networks
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session load timeout')), 15000)
        );

        const sessionPromise = AuthService.getCurrentUserWithApproval();

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const { user: currentUser } = result as { user: any };

        // Only set user if we actually got one, don't clear existing user on errors
        if (currentUser) {
          setUser(currentUser);
          log.info('AuthContext: Session loaded successfully', { hasUser: !!currentUser });
        } else {
          // Only clear user if we're certain there's no valid session
          const { session } = await AuthService.getSession();
          if (!session) {
            setUser(null);
            log.info('AuthContext: No valid session found, clearing user');
          } else {
            log.info('AuthContext: Session exists but no user data, keeping current state');
          }
        }
      } catch (error) {
        log.warn('AuthContext: Session load warning (not clearing user):', error);
        // Don't immediately clear user on session load errors
        // Instead, check if we have a valid session first
        try {
          const { session } = await AuthService.getSession();
          if (!session) {
            setUser(null);
          }
          // If session exists, keep current user state
        } catch (sessionError) {
          log.error('AuthContext: Session check failed:', sessionError);
          setUser(null);
        }
      } finally {
        // Ensure loading is always set to false
        setTimeout(() => setIsLoading(false), 100);
      }
    };

    loadSession();

    // Listen for auth state changes with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log.info('AuthContext: Auth state changed', { event, hasSession: !!session });

        try {
          if (event === 'SIGNED_IN' && session) {
            try {
              const { user: currentUser } = await AuthService.getCurrentUserWithApproval();
              if (currentUser) {
                setUser(currentUser);
              } else {
                // If no user data but session exists, keep current user or clear
                setUser(null);
              }
            } catch (error) {
              log.warn('AuthContext: Error loading user after sign in (keeping session):', error);
              // Don't clear user immediately, just log the error
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            log.info('AuthContext: User signed out');
          } else if (event === 'TOKEN_REFRESHED') {
            if (!session) {
              log.warn('AuthContext: Token refresh failed, clearing user');
              setUser(null);
            } else {
              // Token refreshed successfully, try to get fresh user data
              try {
                const { user: currentUser } = await AuthService.getCurrentUserWithApproval();
                if (currentUser) {
                  setUser(currentUser);
                }
              } catch (error) {
                log.warn('AuthContext: Error refreshing user data:', error);
              }
            }
          } else if (event === 'PASSWORD_RECOVERY') {
            // Keep user state for password recovery
            log.info('AuthContext: Password recovery initiated');
          }
        } catch (error) {
          log.error('AuthContext: Error handling auth state change:', error);
          // Don't immediately clear user on auth state errors
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { user: authUser, error } = await AuthService.signIn({ email, password })
      
      if (error) {
        throw new Error(error.message)
      }
      
      if (authUser) {
        setUser(authUser)
      }
    } catch (error) {
      log.error('Sign in error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      await AuthService.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}