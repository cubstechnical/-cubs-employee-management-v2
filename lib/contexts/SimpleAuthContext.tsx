'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, type AuthUser } from '@/lib/services/auth'
import { MobileAuthService } from '@/lib/services/mobileAuth'
import { BiometricAuthService } from '@/lib/services/biometricAuth'
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
  const [isLoading, setIsLoading] = useState(false) // Start with false to prevent loading screens

  useEffect(() => {
    // Simplified session loading to prevent white page issues
    const loadSession = async () => {
      try {
        log.info('SimpleAuthContext: Starting session loading...', {
          isCapacitorApp: isCapacitorApp(),
          isSupabaseAvailable: typeof window !== 'undefined' && (window as any).supabase
        });

        // Simplified session loading for both web and mobile
        // Use the same approach to prevent conflicts and hanging
        try {
          const userData = await Promise.race([
            AuthService.getCurrentUser(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 2000))
          ]) as any;

          if (userData && userData.id) {
            log.info('SimpleAuthContext: Session found');
            setUser(userData);
          } else {
            log.info('SimpleAuthContext: No session found');
          }
        } catch (error) {
          log.warn('SimpleAuthContext: Session loading failed:', error);
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
    }, 3000); // 3 second fallback - reduced for mobile

    // Simple auth state change listener (always subscribe via imported supabase client)
    let subscription: any = null;
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

    return () => {
      clearTimeout(fallbackTimeout);
      // CRITICAL FIX: Only unsubscribe if subscription exists
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
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

        // Store biometric credentials for native apps to enable biometric login
        try {
          await BiometricAuthService.enableBiometricLogin(email, password);
          log.info('SimpleAuthContext: Biometric credentials stored successfully');
        } catch (mobileError) {
          log.warn('SimpleAuthContext: Failed to store biometric credentials:', mobileError);
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
      if (isCapacitorApp()) {
        try {
          await BiometricAuthService.disableBiometricLogin();
          log.info('SimpleAuthContext: Biometric credentials cleared on sign out');
        } catch (error) {
          log.warn('SimpleAuthContext: Failed to clear biometric credentials on sign out:', error);
        }
      }

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
