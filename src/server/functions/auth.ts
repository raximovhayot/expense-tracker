import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import { redirect } from '@tanstack/react-router'
import { createAdminClient, createSessionClient } from '../lib/appwrite'
import { setCookie, deleteCookie, getCookie } from '@tanstack/react-start/server'
import { AppwriteException } from 'node-appwrite'

/**
 * 1. GET CURRENT USER
 *    Reads cookies -> checks session -> returns user or null
 */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const sessionSecret = getCookie('appwrite-session-secret')
    if (!sessionSecret) return null

    const client = await createSessionClient(sessionSecret)
    // If the session is invalid, this will throw
    const account = await client.account.get()
    return account
  } catch (error) {
    // If session is expired or invalid, swallow error and return null
    return null
  }
})

/**
 * 2. AUTH MIDDLEWARE
 *    Used by protected routes to ensure user is logged in
 */
export const authMiddleware = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUser()
  return { currentUser: user }
})

/**
 * 3. SIGN OUT
 *    Clears cookies
 */
export const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie('appwrite-session-secret', { path: '/' })
  deleteCookie('appwrite-session-id', { path: '/' })
  throw redirect({ to: '/sign-in' })
})

/**
 * 4. SIGN IN WITH GOOGLE
 *    Redirects the user to Appwrite's Google OAuth endpoint
 */
export const signInWithGoogleFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ redirect: z.string().optional() }))
  .handler(async () => {
    // const { redirect: redirectPath } = data

    const projectId = process.env.APPWRITE_PROJECT_ID
    const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'

    // Determine the base URL for callbacks
    // In dev: http://localhost:3000
    // In prod: Your actual domain
    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000'

    // The URL Appwrite should redirect back to on success
    // IMPORTANT: This must match a domain/platform in Appwrite, 
    // but for "Web" platforms, localhost is usually allowed.
    // We append nothing else to keep it robust.
    const successUrl = `${baseUrl}/oauth-callback`
    const failureUrl = `${baseUrl}/sign-in`

    if (!projectId) {
      throw new Error('APPWRITE_PROJECT_ID is not defined')
    }

    // Construct the manual OAuth2 URL
    // Reference: https://appwrite.io/docs/references/cloud/client-web/account#createOAuth2Session
    // (We are mimicking what the client SDK does, but manually so we can server-redirect)
    const targetUrl = `${endpoint}/account/sessions/oauth2/google?project=${projectId}&success=${encodeURIComponent(successUrl)}&failure=${encodeURIComponent(failureUrl)}`

    console.log('[Auth] Redirecting to Google OAuth:', targetUrl)

    throw redirect({ href: targetUrl })
  })

/**
 * 5. COMPLETE OAUTH
 *    Called by the callback route (server-side loader) 
 *    to exchange secret/userId for a valid session cookie.
 */
export const completeOAuthFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    userId: z.string(),
    secret: z.string()
  }))
  .handler(async ({ data }) => {
    const { userId, secret } = data
    const { account } = createAdminClient()

    console.log(`[Auth] Completing OAuth for UserID: ${userId}`)

    try {
      // Create the session using the admin client + user secrets
      const session = await account.createSession(userId, secret)

      console.log('[Auth] Session created. Setting cookies.')

      const isProd = process.env.NODE_ENV === 'production'
      const cookieOpts = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      }

      setCookie('appwrite-session-secret', session.secret, cookieOpts)
      setCookie('appwrite-session-id', session.$id, cookieOpts)

      return { success: true }
    } catch (err: any) {
      console.error('[Auth] Error creating session:', err)
      const message = err instanceof AppwriteException ? err.message : 'Unknown error'
      throw new Error(`Failed to create session: ${message}`)
    }
  })
