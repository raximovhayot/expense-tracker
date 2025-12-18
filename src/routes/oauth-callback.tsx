import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { completeOAuthFn } from '@/server/functions/auth'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { AlertCircle, Loader2 } from 'lucide-react'

const searchSchema = z.object({
  userId: z.string().optional(),
  secret: z.string().optional(),
  error: z.string().optional(),
})

type SearchParams = z.infer<typeof searchSchema>

type LoaderData =
  | { status: 'success' }
  | { status: 'error'; message: string; code: string }
  | { status: 'loading' }

export const Route = createFileRoute('/oauth-callback')({
  validateSearch: searchSchema,

  loaderDeps: ({ search }) => ({ search }),

  loader: async ({ deps }): Promise<LoaderData> => {
    const { search } = deps
    const { userId, secret, error } = search as SearchParams

    // Handle OAuth failure from Appwrite
    if (error) {
      console.error('[OAuth Callback] OAuth provider error:', error)
      return {
        status: 'error',
        message: 'Authentication was cancelled or failed at the provider.',
        code: 'provider_error'
      }
    }

    // Validate required credentials
    if (!userId || !secret) {
      console.error('[OAuth Callback] Missing credentials:', { userId: !!userId, secret: !!secret })
      return {
        status: 'error',
        message: 'Missing authentication credentials. Please try signing in again.',
        code: 'missing_credentials'
      }
    }

    try {
      // Exchange credentials for session
      const result = await completeOAuthFn({ data: { userId, secret } })

      if (result.success) {
        // Redirect to the intended destination
        throw redirect({ to: result.redirectTo || '/' })
      }

      return {
        status: 'error',
        message: 'Session creation failed. Please try again.',
        code: 'session_failed'
      }
    } catch (error) {
      // Handle redirect (this is expected for success)
      if (
        error instanceof Response ||
        (typeof error === 'object' && error !== null && 'headers' in error)
      ) {
        throw error
      }

      console.error('[OAuth Callback] Session creation error:', error)

      const message = error instanceof Error
        ? error.message
        : 'An unexpected error occurred during authentication.'

      return {
        status: 'error',
        message,
        code: 'unknown_error'
      }
    }
  },

  component: OAuthCallbackPage,
  pendingComponent: OAuthCallbackLoading,
})

function OAuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold text-foreground">
          Completing sign in...
        </h2>
        <p className="text-muted-foreground">
          Please wait while we set up your session.
        </p>
      </div>
    </div>
  )
}

function OAuthCallbackPage() {
  const data = Route.useLoaderData() as LoaderData

  // Loading state (shouldn't normally show, but just in case)
  if (data.status === 'loading') {
    return <OAuthCallbackLoading />
  }

  // Success state (shouldn't show - should have redirected)
  if (data.status === 'success') {
    return <OAuthCallbackLoading />
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border border-destructive/20 rounded-lg p-8 shadow-lg">
          <div className="text-center space-y-4">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-foreground">
              Authentication Failed
            </h1>

            {/* Error Message */}
            <p className="text-muted-foreground">
              {data.message}
            </p>

            {/* Error Code (for debugging) */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-muted-foreground/60 font-mono">
                Error code: {data.code}
              </p>
            )}

            {/* Actions */}
            <div className="pt-4 space-y-3">
              <Button asChild className="w-full">
                <Link to="/sign-in">
                  Try Again
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
