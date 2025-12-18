/**
 * Auth Hook
 * Provides auth state and actions for components
 */
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  signInWithGoogle,
  signOut as clientSignOut,
  getSession,
  getUser,
} from '@/lib/appwrite-client'
import { authMiddleware, clearSessionFn } from '@/server/functions/auth'

interface AuthState {
  isSigningIn: boolean
  isSigningOut: boolean
  isLoading: boolean
  error: string | null
}

interface User {
  $id: string
  email: string
  name: string
}

export function useAuth() {
  const navigate = useNavigate()
  const [state, setState] = useState<AuthState>({
    isSigningIn: false,
    isSigningOut: false,
    isLoading: true, // Start loading
    error: null,
  })
  const [user, setUser] = useState<User | null>(null)

  const clearServerSession = useServerFn(clearSessionFn)

  /**
   * Check session on mount
   */
  useEffect(() => {
    async function checkAuth() {
      try {
        // Check server session (from cookie)
        const { currentUser } = await authMiddleware()

        if (currentUser) {
          setUser(currentUser as User)
        } else {
          // No server session, check client session
          const session = await getSession()
          if (session) {
            const userData = await getUser()
            if (userData) {
              setUser(userData as User)
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Session check failed:', error)
      } finally {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    checkAuth()
  }, [])

  /**
   * Sign in with Google
   */
  const signIn = useCallback((redirectTo?: string) => {
    setState(prev => ({ ...prev, isSigningIn: true, error: null }))
    signInWithGoogle(redirectTo)
  }, [])

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isSigningOut: true, error: null }))

    try {
      // Clear client session
      await clientSignOut()

      // Clear server session
      await clearServerSession()

      setUser(null)
      navigate({ to: '/sign-in' })
    } catch (error) {
      console.error('[Auth] Sign out failed:', error)
      setState(prev => ({
        ...prev,
        isSigningOut: false,
        error: 'Failed to sign out',
      }))
    }
  }, [navigate, clearServerSession])

  /**
   * Refresh user from server
   */
  const refreshUser = useCallback(async () => {
    try {
      const { currentUser } = await authMiddleware()
      if (currentUser) {
        setUser(currentUser as User)
      }
      return currentUser
    } catch {
      return null
    }
  }, [])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // User
    user,
    currentUser: user, // Alias for backward compatibility
    isAuthenticated: !!user,

    // State
    ...state,

    // Actions
    signIn,
    signOut,
    refreshUser,
    clearError,
  }
}
