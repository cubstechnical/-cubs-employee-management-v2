'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, type AuthUser } from '@/lib/services/auth'

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
      } catch (error) {
        console.error('Error loading session:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
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
      console.error('Sign in error:', error)
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