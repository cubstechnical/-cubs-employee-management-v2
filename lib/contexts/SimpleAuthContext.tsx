'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, type AuthUser } from '@/lib/services/auth'
import { supabase } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'

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
    // Simple session loading - same for web and mobile
    const loadSession = async () => {
      try {
        // Quick timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session load timeout')), 2000)
        )

        const sessionPromise = (async () => {
          // Simple session check - works for both web and mobile
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error) {
            log.warn('Session error:', error)
            return null
          }

          if (session?.user) {
            const userData = await AuthService.getCurrentUser()
            if (userData) {
              setUser(userData)
              return
            }
          }

          return null
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
            const userData = await AuthService.getCurrentUser()
            if (userData) {
              setUser(userData)
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
          }
        } catch (error) {
          log.error('Auth state change error:', error)
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
