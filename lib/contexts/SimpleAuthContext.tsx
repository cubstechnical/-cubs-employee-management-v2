'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, type AuthUser } from '@/lib/services/auth'
import { MobileAuthService } from '@/lib/services/mobileAuth'
import { supabase } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'
import { isCapacitorApp } from '@/utils/mobileDetection'

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
    // Ultra-simplified session loading to prevent white page issues
    const loadSession = async () => {
      try {
        // Quick timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session load timeout')), 2000)
        )

        const sessionPromise = (async () => {
          const isMobile = isCapacitorApp()
          
          if (isMobile) {
            // For mobile, use enhanced mobile auth service
            try {
              const { session, error } = await MobileAuthService.restoreMobileSession()
              if (session && !error) {
                const userData = await AuthService.getCurrentUser()
                if (userData) {
                  setUser(userData)
                  return
                }
              }
            } catch (mobileError) {
              log.warn('Mobile session restoration failed, trying direct user fetch:', mobileError)
              // Fallback: try direct user fetch for iPhone 13
              try {
                const userData = await AuthService.getCurrentUser()
                if (userData) {
                  setUser(userData)
                  return
                }
              } catch (fallbackError) {
                log.warn('Mobile fallback also failed:', fallbackError)
              }
            }
          } else {
            // For web, standard flow
            const userData = await AuthService.getCurrentUser()
            if (userData) {
              setUser(userData)
              return
            }
          }
        })()

        await Promise.race([sessionPromise, timeoutPromise])
      } catch (error) {
        log.warn('SimpleAuthContext: Session loading failed (non-critical):', error)
        // Don't throw - just continue without user
      } finally {
        // Always set loading to false immediately
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
              // Use mobile auth service for session storage
              if (isCapacitorApp()) {
                MobileAuthService.storeMobileSession(session)
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            if (isCapacitorApp()) {
              MobileAuthService.clearMobileSession()
            }
          } else if (event === 'TOKEN_REFRESHED' && session) {
            if (isCapacitorApp()) {
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
