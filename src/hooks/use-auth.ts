import { useCallback, useState } from 'react'
import { useRouter, useRouteContext } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  signInWithGoogleFn,
  signOutFn,
  refreshSessionFn
} from '@/server/functions/auth'

interface AuthState {
  isLoading: boolean
  isSigningIn: boolean
  isSigningOut: boolean
  error: string | null
}

/**
 * Custom hook for authentication actions and current user access
 * Provides loading states, error handling, and user data
 */
export function useAuth() {
  const router = useRouter()

  // Get current user from route context (loaded by _protected or __root loader)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeContext = useRouteContext({ from: '__root__' }) as any
  const currentUser = routeContext?.currentUser ?? null

  const [state, setState] = useState<AuthState>({
    isLoading: false,
    isSigningIn: false,
    isSigningOut: false,
    error: null,
  })

  // Server function bindings
  const signInWithGoogle = useServerFn(signInWithGoogleFn)
  const signOut = useServerFn(signOutFn)
  const refreshSession = useServerFn(refreshSessionFn)

  /**
   * Handle Google sign in
   */
  const handleSignIn = useCallback(async (redirectTo?: string) => {
    setState(prev => ({ ...prev, isSigningIn: true, error: null }))

    try {
      await signInWithGoogle({ data: { redirectTo } })
    } catch (error) {
      // Redirects are thrown as errors in TanStack Start - this is expected
      // Only log actual errors
      if (error instanceof Error && !error.message.includes('redirect')) {
        console.error('[useAuth] Sign in error:', error)
        setState(prev => ({
          ...prev,
          isSigningIn: false,
          error: 'Failed to initiate sign in. Please try again.'
        }))
      }
    }
  }, [signInWithGoogle])

  /**
   * Handle sign out
   */
  const handleSignOut = useCallback(async () => {
    setState(prev => ({ ...prev, isSigningOut: true, error: null }))

    try {
      await signOut()
    } catch (error) {
      // Redirects are expected
      if (error instanceof Error && !error.message.includes('redirect')) {
        console.error('[useAuth] Sign out error:', error)
        setState(prev => ({
          ...prev,
          isSigningOut: false,
          error: 'Failed to sign out. Please try again.'
        }))
      }
    }
  }, [signOut])

  /**
   * Check and refresh session validity
   */
  const checkSession = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const result = await refreshSession()

      if (!result.valid) {
        // Session is invalid, redirect to sign in
        router.navigate({ to: '/sign-in' })
      }

      return result
    } catch (error) {
      console.error('[useAuth] Session check error:', error)
      return { valid: false, reason: 'error' }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [refreshSession, router])

  /**
   * Clear any auth errors
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // User data
    currentUser,
    isAuthenticated: !!currentUser,

    // Auth state
    ...state,

    // Auth actions
    signIn: handleSignIn,
    signOut: handleSignOut,
    checkSession,
    clearError,
  }
}

/**
 * Hook to get session status
 * Uses the route loader data for the current user
 */
export function useSessionCheck() {
  const { isLoading, currentUser } = useAuth()
  const isValid = !!currentUser

  return { isValid, isLoading, currentUser }
}
