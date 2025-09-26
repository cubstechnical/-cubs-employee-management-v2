'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, type AuthUser } from '@/lib/services/auth'
import { supabase } from '@/lib/supabase/client'
import { handleAuthError, isRefreshTokenError } from '@/lib/utils/authErrorHandler'
import { log } from '@/lib/utils/logger'
import { isCapacitorApp } from '@/utils/mobileDetection'

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
    // Simplified session loading to prevent white page issues
    const loadSession = async () => {
      try {
        const isMobile = isCapacitorApp();

        // Simplified mobile session loading
        if (isMobile) {
          const { session, error } = await AuthService.restoreMobileSession();
          if (session) {
            const userData = await AuthService.getCurrentUserWithApproval();
            if (userData.user) {
              setUser(userData.user);
              log.info('AuthContext: Mobile session loaded successfully');
            }
          }
        } else {
          // Web session loading
          const userData = await AuthService.getCurrentUserWithApproval();
          if (userData.user) {
            setUser(userData.user);
            log.info('AuthContext: Web session loaded successfully');
          }
        }
      } catch (error) {
        log.warn('AuthContext: Session loading failed (keeping current state):', error);
        // Don't clear user on session load errors to prevent white page
        // The app will still be usable even without authentication
      } finally {
        // Always set loading to false to prevent infinite loading
        setTimeout(() => {
          setIsLoading(false);
          log.info('AuthContext: Loading state set to false');
        }, 100);
      }
    };

    loadSession();

    // Listen for auth state changes with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log.info('AuthContext: Auth state changed', {
          event,
          hasSession: !!session,
          isMobile: isCapacitorApp()
        });

        try {
          if (event === 'SIGNED_IN' && session) {
            try {
              const { user: currentUser } = await AuthService.getCurrentUserWithApproval();
              if (currentUser) {
                setUser(currentUser);

                // Store session data for mobile app restoration
                if (isCapacitorApp()) {
                  localStorage.setItem('cubs-auth-token', JSON.stringify({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token,
                    expires_at: session.expires_at
                  }));
                  localStorage.setItem('cubs_session_persisted', 'true');
                  localStorage.setItem('cubs_last_login', new Date().toISOString());
                  localStorage.setItem('cubs_user_email', currentUser.email || '');
                  localStorage.setItem('cubs_user_id', currentUser.id || '');
                  log.info('AuthContext: Mobile session data stored after sign in');
                }
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
            // Clear mobile session data
            if (isCapacitorApp()) {
              localStorage.removeItem('cubs-auth-token');
              localStorage.removeItem('cubs_session_persisted');
              localStorage.removeItem('cubs_last_login');
              localStorage.removeItem('cubs_user_email');
              localStorage.removeItem('cubs_user_id');
            }
            log.info('AuthContext: User signed out');
          } else if (event === 'TOKEN_REFRESHED') {
            if (!session) {
              log.warn('AuthContext: Token refresh failed, clearing user');
              setUser(null);
            } else {
              // Store updated session data for mobile app
              if (isCapacitorApp()) {
                localStorage.setItem('cubs-auth-token', JSON.stringify({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                  expires_at: session.expires_at
                }));
                log.info('AuthContext: Mobile session data updated after token refresh');
              }

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

          // Mobile-specific session handling
          if (isCapacitorApp()) {
            log.info('AuthContext: Mobile app auth state change detected');

            if (session) {
              // Ensure session data is always up to date
              localStorage.setItem('cubs-auth-token', JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at
              }));
              log.info('AuthContext: Mobile session data synchronized');
            } else {
              // Session lost, attempt recovery
              log.warn('AuthContext: Mobile session lost, attempting recovery...');
              setTimeout(async () => {
                try {
                  const { session: recoveredSession } = await AuthService.restoreMobileSession();
                  if (recoveredSession) {
                    log.info('AuthContext: Mobile session recovered successfully');
                    // Re-trigger user data loading
                    const { user: currentUser } = await AuthService.getCurrentUserWithApproval();
                    if (currentUser) {
                      setUser(currentUser);
                    }
                  }
                } catch (error) {
                  log.warn('AuthContext: Mobile session recovery failed:', error);
                }
              }, 1000);
            }
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