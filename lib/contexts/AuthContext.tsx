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
    // Load user session from Supabase
    const loadSession = async () => {
      try {
        const { user: currentUser } = await AuthService.getCurrentUserWithApproval()
        setUser(currentUser)
        log.info('AuthContext: Session loaded', { hasUser: !!currentUser })
      } catch (error) {
        log.error('Error loading session:', error)
        await handleAuthError(error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log.info('AuthContext: Auth state changed', { event, hasSession: !!session })
        
        try {
          if (event === 'SIGNED_IN' && session) {
            try {
              const { user: currentUser } = await AuthService.getCurrentUserWithApproval()
              setUser(currentUser)
            } catch (error) {
              log.error('Error loading user after sign in:', error)
              await handleAuthError(error)
              setUser(null)
            }
          } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            // Handle token refresh errors gracefully
            if (event === 'TOKEN_REFRESHED' && !session) {
              log.warn('AuthContext: Token refresh failed, signing out')
              setUser(null)
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
            }
          } else if (event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
            setUser(null)
          }
        } catch (error) {
          log.error('AuthContext: Error handling auth state change:', error)
          await handleAuthError(error)
          // If there's an error with auth state, clear the user
          setUser(null)
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