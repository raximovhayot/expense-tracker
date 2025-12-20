/**
 * Appwrite Client Configuration
 * Client-side SDK for browser operations
 */
import { Client, Account, OAuthProvider } from 'appwrite'

// =============================================================================
// CLIENT CONFIGURATION
// =============================================================================

const client = new Client()

// Only configure in browser environment
if (typeof window !== 'undefined') {
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID

    if (!projectId) {
        console.error('[Appwrite] VITE_APPWRITE_PROJECT_ID is not configured')
    }

    client.setEndpoint(endpoint).setProject(projectId || '')
}

// Account service
export const account = new Account(client)

// =============================================================================
// AUTH FUNCTIONS
// =============================================================================

/**
 * Sign in with Google OAuth
 * Redirects to Google for authentication
 */
export function signInWithGoogle(redirectTo?: string): void {
    if (typeof window === 'undefined') return

    const baseUrl = window.location.origin

    // Store redirect destination for after OAuth
    if (redirectTo) {
        sessionStorage.setItem('auth_redirect', redirectTo)
    }

    // Initiate OAuth with Appwrite SDK
    account.createOAuth2Session(
        OAuthProvider.Google,
        `${baseUrl}/oauth-callback`,
        `${baseUrl}/sign-in?error=oauth_failed`
    )
}

/**
 * Get current session
 */
export async function getSession() {
    try {
        return await account.getSession('current')
    } catch {
        return null
    }
}

/**
 * Get current user
 */
export async function getUser() {
    try {
        return await account.get()
    } catch {
        return null
    }
}

/**
 * Sign out - delete current session
 */
export async function signOut(): Promise<void> {
    try {
        await account.deleteSession('current')
    } catch (error) {
        console.error('[Auth] Sign out error:', error)
    }
}

/**
 * Get stored redirect URL and clear it
 */
export function getAndClearRedirect(): string {
    if (typeof window === 'undefined') return '/budgets'
    const redirect = sessionStorage.getItem('auth_redirect') || '/budgets'
    sessionStorage.removeItem('auth_redirect')
    return redirect
}

export { client }
