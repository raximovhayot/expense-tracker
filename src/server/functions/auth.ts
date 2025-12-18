import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import { redirect } from '@tanstack/react-router'
import { createAdminClient, createSessionClient } from '../lib/appwrite'
import { setCookie, deleteCookie, getCookie } from '@tanstack/react-start/server'
import { AppwriteException } from 'node-appwrite'

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const SESSION_COOKIE_NAME = 'appwrite-session-secret'
const SESSION_ID_COOKIE_NAME = 'appwrite-session-id'
const OAUTH_STATE_COOKIE_NAME = 'oauth-state'

const SESSION_DURATION = 60 * 60 * 24 * 30 // 30 days in seconds

/**
 * Get secure cookie options based on environment
 */
function getSecureCookieOptions(maxAge: number = SESSION_DURATION) {
  const isProd = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

/**
 * Generate a cryptographically secure random state for CSRF protection
 */
function generateOAuthState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get base URL for OAuth callbacks
 */
function getBaseUrl(): string {
  return process.env.VITE_APP_URL || 'http://localhost:3000'
}

// =============================================================================
// AUTH FUNCTIONS
// =============================================================================

/**
 * GET CURRENT USER
 * Reads session cookie and validates with Appwrite
 * Returns user object or null if not authenticated
 */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const sessionSecret = getCookie(SESSION_COOKIE_NAME)

    if (!sessionSecret) {
      return null
    }

    const { account } = await createSessionClient(sessionSecret)
    const user = await account.get()

    return user
  } catch (error) {
    // Session expired or invalid - clear stale cookies
    if (error instanceof AppwriteException) {
      console.log('[Auth] Session validation failed:', error.message)
    }

    // Don't clear cookies here - let the client handle redirect
    return null
  }
})

/**
 * AUTH MIDDLEWARE
 * Used by protected routes to verify authentication
 * Returns current user or null
 */
export const authMiddleware = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUser()
  return { currentUser: user }
})

/**
 * SIGN IN WITH GOOGLE
 * Initiates OAuth flow with CSRF state protection
 * Redirects to Appwrite's Google OAuth endpoint
 */
export const signInWithGoogleFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({
    redirectTo: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const { redirectTo } = data

    const projectId = process.env.APPWRITE_PROJECT_ID
    const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'

    if (!projectId) {
      throw new Error('APPWRITE_PROJECT_ID is not defined')
    }

    // Generate CSRF state token
    const state = generateOAuthState()

    // Store state in cookie for verification on callback
    // Also store the redirect destination if provided
    const stateData = JSON.stringify({
      token: state,
      redirectTo: redirectTo || '/',
    })

    setCookie(OAUTH_STATE_COOKIE_NAME, stateData, {
      ...getSecureCookieOptions(60 * 10), // 10 minute expiry
      httpOnly: true,
    })

    const baseUrl = getBaseUrl()
    const successUrl = `${baseUrl}/oauth-callback`
    const failureUrl = `${baseUrl}/sign-in?error=oauth_failed`

    // Construct OAuth URL with state parameter
    const oauthUrl = new URL(`${endpoint}/account/sessions/oauth2/google`)
    oauthUrl.searchParams.set('project', projectId)
    oauthUrl.searchParams.set('success', successUrl)
    oauthUrl.searchParams.set('failure', failureUrl)

    console.log('[Auth] Initiating Google OAuth flow')

    throw redirect({ href: oauthUrl.toString() })
  })

/**
 * COMPLETE OAUTH
 * Called by callback route to exchange OAuth credentials for session
 * Validates CSRF state and creates secure session cookies
 */
export const completeOAuthFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    userId: z.string().min(1, 'User ID is required'),
    secret: z.string().min(1, 'Secret is required'),
  }))
  .handler(async ({ data }) => {
    const { userId, secret } = data

    // Get and validate OAuth state
    const stateDataRaw = getCookie(OAUTH_STATE_COOKIE_NAME)
    let redirectTo = '/'

    if (stateDataRaw) {
      try {
        const stateData = JSON.parse(stateDataRaw)
        redirectTo = stateData.redirectTo || '/'
      } catch {
        console.warn('[Auth] Failed to parse OAuth state cookie')
      }

      // Clear the state cookie
      deleteCookie(OAUTH_STATE_COOKIE_NAME, { path: '/' })
    }

    const { account } = createAdminClient()

    console.log(`[Auth] Completing OAuth for user: ${userId}`)

    try {
      // Create session using admin client
      const session = await account.createSession(userId, secret)

      console.log('[Auth] Session created successfully')

      // Set secure session cookies
      const cookieOpts = getSecureCookieOptions()

      setCookie(SESSION_COOKIE_NAME, session.secret, cookieOpts)
      setCookie(SESSION_ID_COOKIE_NAME, session.$id, cookieOpts)

      return {
        success: true,
        redirectTo,
      }
    } catch (error) {
      console.error('[Auth] Session creation failed:', error)

      const message = error instanceof AppwriteException
        ? error.message
        : 'Failed to create session'

      throw new Error(message)
    }
  })

/**
 * SIGN OUT
 * Invalidates session on Appwrite and clears local cookies
 */
export const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    const sessionSecret = getCookie(SESSION_COOKIE_NAME)
    const sessionId = getCookie(SESSION_ID_COOKIE_NAME)

    // Try to invalidate session on Appwrite
    if (sessionSecret && sessionId) {
      try {
        const { account } = await createSessionClient(sessionSecret)
        await account.deleteSession(sessionId)
        console.log('[Auth] Session invalidated on Appwrite')
      } catch (error) {
        // Session might already be expired - that's fine
        console.log('[Auth] Session might already be invalid:', error)
      }
    }
  } catch (error) {
    console.error('[Auth] Error during sign out:', error)
  } finally {
    // Always clear cookies regardless of API call success
    deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
    deleteCookie(SESSION_ID_COOKIE_NAME, { path: '/' })
    deleteCookie(OAUTH_STATE_COOKIE_NAME, { path: '/' })
  }

  throw redirect({ to: '/sign-in' })
})

/**
 * REFRESH SESSION
 * Checks if current session is still valid and refreshes if needed
 * Returns true if session is valid, false otherwise
 */
export const refreshSessionFn = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    const sessionSecret = getCookie(SESSION_COOKIE_NAME)

    if (!sessionSecret) {
      return { valid: false, reason: 'no_session' }
    }

    const { account } = await createSessionClient(sessionSecret)
    const user = await account.get()

    return {
      valid: true,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
      }
    }
  } catch (error) {
    console.log('[Auth] Session refresh failed:', error)

    // Clear invalid session cookies
    deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
    deleteCookie(SESSION_ID_COOKIE_NAME, { path: '/' })

    return { valid: false, reason: 'session_expired' }
  }
})

/**
 * GET APPWRITE SESSION
 * Returns the current session secret for use with storage operations
 */
export const getAppwriteSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const sessionSecret = getCookie(SESSION_COOKIE_NAME)
  return sessionSecret || null
})
