'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, type AuthUser } from '@/lib/services/auth'
import { MobileAuthService } from '@/lib/services/mobileAuth'
import { supabase } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'
import { isCapacitorApp, isIPhoneCapacitorApp, isIPhoneDevice } from '@/utils/mobileDetection'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simplified session loading to prevent white page issues
    const loadSession = async () => {
      try {
        log.info('SimpleAuthContext: Starting session loading...', {
          isCapacitorApp: isCapacitorApp(),
          isSupabaseAvailable: typeof window !== 'undefined' && (window as any).supabase
        });

        // For mobile apps, use a much simpler approach
        if (isCapacitorApp()) {
          log.info('SimpleAuthContext: Mobile app detected, using simplified auth');
          
          // Try mobile session restoration with shorter timeout
          try {
            const mobileSession = await Promise.race([
              MobileAuthService.restoreMobileSession(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Mobile session timeout')), 3000))
            ]) as any;
            
            if (mobileSession && mobileSession.session) {
              log.info('SimpleAuthContext: Mobile session restored successfully');
              setUser(mobileSession.session);
            } else {
              log.info('SimpleAuthContext: No mobile session found');
            }
          } catch (mobileError) {
            log.warn('SimpleAuthContext: Mobile session restoration failed:', mobileError);
          }
        } else {
          // Web/PWA session loading
          try {
            const userData = await Promise.race([
              AuthService.getCurrentUser(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 3000))
            ]) as any;
            
            if (userData && userData.id) {
              log.info('SimpleAuthContext: Web session found');
              setUser(userData);
            } else {
              log.info('SimpleAuthContext: No web session found');
            }
          } catch (webError) {
            log.warn('SimpleAuthContext: Web session loading failed:', webError);
          }
        }
      } catch (error) {
        log.warn('SimpleAuthContext: Session loading failed (non-critical):', error);
      } finally {
        // Always set loading to false after a short delay
        setTimeout(() => {
          setIsLoading(false);
          log.info('SimpleAuthContext: Loading state set to false');
        }, 500);
      }
    }

    loadSession()

    // Fallback timeout to ensure loading never hangs
    const fallbackTimeout = setTimeout(() => {
      log.warn('SimpleAuthContext: Fallback timeout triggered, forcing loading to false');
      setIsLoading(false);
    }, 5000); // 5 second fallback

    // Simple auth state change listener - only if Supabase is available
    let subscription: any = null;
    if (typeof window !== 'undefined' && (window as any).supabase) {
      try {
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            try {
              if (event === 'SIGNED_IN' && session) {
                const currentUser = await AuthService.getCurrentUser()
                if (currentUser) {
                  setUser(currentUser)
                }
              } else if (event === 'SIGNED_OUT') {
                setUser(null)
              }
            } catch (error) {
              log.warn('SimpleAuthContext: Auth state change error:', error)
            } finally {
              setIsLoading(false)
            }
          }
        )
        subscription = authSubscription;
      } catch (error) {
        log.warn('SimpleAuthContext: Failed to set up auth state listener:', error);
      }
    }

    return () => {
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      log.info('SimpleAuthContext: Starting sign in process...', { email })

      const result = await AuthService.signIn({ email, password })

      if (result.error) {
        log.error('SimpleAuthContext: Sign in failed:', result.error.message)
        throw new Error(result.error.message)
      }

      if (!result.user) {
        log.error('SimpleAuthContext: No user returned from sign in')
        throw new Error('Authentication failed - no user data returned')
      }

      log.info('SimpleAuthContext: Sign in successful, setting user:', result.user.id)
      setUser(result.user)

      // Ensure mobile session is properly stored
      if (isCapacitorApp()) {
        try {
          await MobileAuthService.storeMobileSession(result.user);
          log.info('SimpleAuthContext: Mobile session stored successfully');
        } catch (mobileError) {
          log.warn('SimpleAuthContext: Failed to store mobile session:', mobileError);
        }
      }

    } catch (error) {
      log.error('SimpleAuthContext: Sign in error:', error)
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
      log.error('SimpleAuthContext: Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider')
  }
  return context
}
