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
        // Set a reasonable timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session load timeout')), 3000)
        )

        const sessionPromise = (async () => {
          // Try to get current user with minimal complexity
          try {
            const userData = await AuthService.getCurrentUser()
            if (userData) {
              setUser(userData)
              return
            }
          } catch (authError) {
            log.warn('AuthService.getCurrentUser failed:', authError)
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
            const { user: currentUser } = await AuthService.getCurrentUserWithApproval()
            if (currentUser) {
              setUser(currentUser)
              // Use mobile auth service for session storage on all mobile/iPhone devices
              if (isCapacitorApp() || isIPhoneDevice() || isIPhoneCapacitorApp()) {
                MobileAuthService.storeMobileSession(session)
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            if (isCapacitorApp() || isIPhoneDevice() || isIPhoneCapacitorApp()) {
              MobileAuthService.clearMobileSession()
            }
          } else if (event === 'TOKEN_REFRESHED' && session) {
            if (isCapacitorApp() || isIPhoneDevice() || isIPhoneCapacitorApp()) {
              MobileAuthService.storeMobileSession(session)
            }
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
      const result = await AuthService.signIn({ email, password })
      if (result.user) {
        setUser(result.user)
      }
      if (result.error) {
        throw new Error(result.error.message)
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
