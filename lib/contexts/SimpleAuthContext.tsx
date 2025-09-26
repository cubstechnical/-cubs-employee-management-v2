'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, type AuthUser } from '@/lib/services/auth'
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
    // Simple session loading to prevent white page issues
    const loadSession = async () => {
      try {
        const isMobile = isCapacitorApp()

        if (isMobile) {
          // Mobile session loading
          const { session } = await AuthService.restoreMobileSession()
          if (session) {
            const userData = await AuthService.getCurrentUserWithApproval()
            if (userData.user) {
              setUser(userData.user)
            }
          }
        } else {
          // Web session loading
          const userData = await AuthService.getCurrentUserWithApproval()
          if (userData.user) {
            setUser(userData.user)
          }
        }
      } catch (error) {
        log.warn('SimpleAuthContext: Session loading failed:', error)
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
              // Store session data for mobile app
              if (isCapacitorApp()) {
                localStorage.setItem('cubs-auth-token', JSON.stringify({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                  expires_at: session.expires_at
                }))
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            if (isCapacitorApp()) {
              localStorage.removeItem('cubs-auth-token')
            }
          } else if (event === 'TOKEN_REFRESHED' && session) {
            if (isCapacitorApp()) {
              localStorage.setItem('cubs-auth-token', JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at
              }))
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
      const result = await AuthService.signIn(email, password)
      if (result.user) {
        setUser(result.user)
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
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
