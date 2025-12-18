/**
 * OAuth Callback Page
 * Verifies session and syncs to server after OAuth
 */
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSession, getUser, getAndClearRedirect } from '@/lib/appwrite-client'
import { useServerFn } from '@tanstack/react-start'
import { syncSessionFn } from '@/server/functions/auth'

// =============================================================================
// ROUTE
// =============================================================================

export const Route = createFileRoute('/oauth-callback')({
  component: OAuthCallbackPage,
})

// =============================================================================
// COMPONENT
// =============================================================================

type Status = 'loading' | 'syncing' | 'success' | 'error'

function OAuthCallbackPage() {
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const syncSession = useServerFn(syncSessionFn)

  useEffect(() => {
    async function handleCallback() {
      try {
        // 1. Verify session exists (set by Appwrite OAuth)
        const session = await getSession()

        if (!session) {
          setStatus('error')
          setError('No session found. Please try signing in again.')
          return
        }

        // 2. Get user info
        const user = await getUser()

        if (!user) {
          setStatus('error')
          setError('Failed to get user info.')
          return
        }

        // 3. Sync session to server
        setStatus('syncing')

        const result = await syncSession({
          data: {
            userId: user.$id,
            email: user.email,
            name: user.name,
          }
        })

        if (!result.success) {
          setStatus('error')
          setError('Failed to sync session.')
          return
        }

        // 4. Success - redirect
        setStatus('success')
        const redirectTo = getAndClearRedirect()

        setTimeout(() => {
          window.location.href = redirectTo
        }, 500)

      } catch (err) {
        console.error('[OAuth Callback] Error:', err)
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleCallback()
  }, [syncSession])

  return <CallbackUI status={status} error={error} />
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

function CallbackUI({ status, error }: { status: Status; error: string }) {
  if (status === 'loading' || status === 'syncing') {
    return (
      <CenteredLayout>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">
          {status === 'loading' ? 'Verifying...' : 'Completing sign in...'}
        </h2>
        <p className="text-muted-foreground">Please wait</p>
      </CenteredLayout>
    )
  }

  if (status === 'success') {
    return (
      <CenteredLayout>
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-xl font-semibold">Sign in successful!</h2>
        <p className="text-muted-foreground">Redirecting...</p>
      </CenteredLayout>
    )
  }

  return (
    <CenteredLayout>
      <div className="w-full max-w-md bg-card border rounded-lg p-8 shadow-lg">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Authentication Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild className="w-full mt-4">
            <Link to="/sign-in">Try Again</Link>
          </Button>
        </div>
      </div>
    </CenteredLayout>
  )
}

function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">{children}</div>
    </div>
  )
}
