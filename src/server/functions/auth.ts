/**
 * Server-side Auth Functions
 * Secure session management with signed tokens
 */
import { createServerFn } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { Client, Account, Users } from 'node-appwrite'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import z from 'zod'
import crypto from 'crypto'

// =============================================================================
// CONSTANTS
// =============================================================================

const SESSION_COOKIE_NAME = 'session'
const SESSION_SECRET = process.env.APPWRITE_API_KEY || 'fallback-secret-key'

// =============================================================================
// CRYPTO HELPERS
// =============================================================================

/**
 * Create HMAC signature for session data
 */
function signSession(data: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('hex')
}

/**
 * Verify session signature
 */
function verifySession(data: string, signature: string): boolean {
  try {
    const expected = signSession(data)
    if (expected.length !== signature.length) {
      return false
    }
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

/**
 * Create signed session cookie value
 */
function createSessionValue(user: { $id: string; email: string; name: string }): string {
  const data = JSON.stringify(user)
  const signature = signSession(data)
  return `${Buffer.from(data).toString('base64')}.${signature}`
}

/**
 * Parse and verify signed session cookie
 */
function parseSessionValue(value: string): { $id: string; email: string; name: string } | null {
  try {
    const [dataBase64, signature] = value.split('.')
    if (!dataBase64 || !signature) return null

    const data = Buffer.from(dataBase64, 'base64').toString('utf-8')

    if (!verifySession(data, signature)) {
      console.error('[Auth] Invalid session signature verification failed')
      return null
    }

    const parsed = JSON.parse(data)
    console.log('[Auth] Successfully parsed session for user:', parsed.email)
    return parsed
  } catch (e) {
    console.error('[Auth] Error parsing session:', e)
    return null
  }
}

// =============================================================================
// ADMIN CLIENT
// =============================================================================

function createAdminClient() {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY

  if (!endpoint || !projectId || !apiKey) {
    throw new Error('Missing Appwrite server configuration')
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey)

  return {
    client,
    account: new Account(client),
    users: new Users(client),
  }
}

// =============================================================================
// AUTH FUNCTIONS
// =============================================================================

/**
 * Auth middleware - verifies signed session cookie
 */
export const authMiddleware = createServerFn({ method: 'GET' }).handler(async () => {
  const sessionCookie = getCookie(SESSION_COOKIE_NAME)
  console.log('[Auth] authMiddleware checking cookie:', sessionCookie ? 'EXISTS' : 'MISSING')

  if (!sessionCookie) {
    return { currentUser: null }
  }

  const user = parseSessionValue(sessionCookie)
  console.log('[Auth] authMiddleware result:', user ? `VALID (${user.email})` : 'INVALID/EXPIRED')
  return { currentUser: user }
})

/**
 * Sync session from client after OAuth
 * Verifies user exists and creates signed session cookie
 */
export const syncSessionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
  }))
  .handler(async ({ data }) => {
    const { userId, email } = data

    try {
      console.log('[Auth] syncSessionFn starting for:', email)
      // Verify user exists in Appwrite
      const { users } = createAdminClient()
      const user = await users.get(userId)

      // Create signed session cookie
      const sessionValue = createSessionValue({
        $id: user.$id,
        email: user.email,
        name: user.name,
      })

      console.log('[Auth] syncSessionFn setting cookie for:', user.email)

      setCookie(SESSION_COOKIE_NAME, sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })

      return { success: true }
    } catch (error) {
      console.error('[Auth] Failed to verify user or set cookie:', error)
      return { success: false }
    }
  })

/**
 * Clear session
 */
export const clearSessionFn = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
  return { success: true }
})

/**
 * Sign out - clear session and redirect
 */
export const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
  throw redirect({ to: '/sign-in' })
})

/**
 * Get user by ID
 */
export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    try {
      const { users } = createAdminClient()
      const user = await users.get(userId)
      return {
        id: user.$id,
        email: user.email,
        name: user.name,
      }
    } catch {
      return null
    }
  })
