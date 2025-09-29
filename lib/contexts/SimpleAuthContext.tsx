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
        // Set a longer timeout for mobile devices to prevent hanging
        const timeoutMs = isCapacitorApp() ? 8000 : 5000; // 8s for mobile, 5s for web
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session load timeout')), timeoutMs)
        )

        const sessionPromise = (async () => {
          // Try to get current user with mobile-optimized approach
          try {
            log.info('SimpleAuthContext: Starting session loading...', {
              isCapacitorApp: isCapacitorApp(),
              isSupabaseAvailable: typeof window !== 'undefined' && window.supabase
            });

            // First try mobile-specific session restoration
            if (isCapacitorApp()) {
              log.info('SimpleAuthContext: Using mobile session restoration');
              const mobileSession = await MobileAuthService.restoreMobileSession();
              if (mobileSession.session) {
                log.info('SimpleAuthContext: Mobile session restored successfully');
                setUser(mobileSession.session);
                return;
              } else {
                log.info('SimpleAuthContext: No mobile session found');
              }
            }

            // Fallback to standard auth check
            log.info('SimpleAuthContext: Using standard auth check');
            const userData = await AuthService.getCurrentUser()
            if (userData) {
              log.info('SimpleAuthContext: Standard auth check found user');
              setUser(userData)
              return
            } else {
              log.info('SimpleAuthContext: Standard auth check found no user');
            }
          } catch (authError) {
            log.warn('SimpleAuthContext: AuthService.getCurrentUser failed:', authError)
            // Don't throw - continue without user
          }
        })()

        await Promise.race([sessionPromise, timeoutPromise])
      } catch (error) {
        log.warn('SimpleAuthContext: Session loading failed (non-critical):', error)
        // Don't throw - just continue without user
      } finally {
        // Always set loading to false
        setIsLoading(false)
      }
    }

    loadSession()

    // Simple auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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

    return () => subscription.unsubscribe()
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
