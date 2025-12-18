import { createFileRoute, useSearch } from '@tanstack/react-router'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, AlertCircle } from 'lucide-react'
import { z } from 'zod'

// Search params for handling redirects and errors
const searchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional(),
})

export const Route = createFileRoute('/_auth/sign-in')({
  validateSearch: (search) => searchSchema.parse(search),
  component: SignInPage,
})

// Google Icon Component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function SignInPage() {
  const { signIn, isSigningIn, error, clearError } = useAuth()
  const search = useSearch({ from: '/_auth/sign-in' })

  const handleSignIn = async () => {
    clearError()
    await signIn(search.redirect)
  }

  // Get error message from URL or auth state
  const errorMessage = search.error
    ? getErrorMessage(search.error)
    : error

  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in with your Google account to access your personal expense tracker"
    >
      <div className="flex flex-col space-y-6 py-4">
        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Sign in failed
              </p>
              <p className="text-sm text-destructive/80">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Google Sign In Button */}
        <Button
          variant="outline"
          type="button"
          disabled={isSigningIn}
          className="w-full h-12 text-base font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center justify-center gap-3 border-2 disabled:opacity-70"
          onClick={handleSignIn}
        >
          {isSigningIn ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Connecting to Google...
            </>
          ) : (
            <>
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </>
          )}
        </Button>

        {/* Redirect Notice */}
        {search.redirect && !isSigningIn && (
          <p className="text-center text-xs text-muted-foreground">
            You'll be redirected back after signing in.
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="text-center text-xs text-muted-foreground mt-6 space-y-2">
        <p>
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-foreground transition-colors">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:text-foreground transition-colors">
            Privacy Policy
          </a>.
        </p>
      </div>
    </AuthCard>
  )
}

/**
 * Map error codes to user-friendly messages
 */
function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    oauth_failed: 'Google sign-in was cancelled or failed. Please try again.',
    session_expired: 'Your session has expired. Please sign in again.',
    access_denied: 'Access was denied. Please try signing in with a different account.',
    invalid_request: 'There was a problem with the sign-in request. Please try again.',
  }

  return messages[code] || 'An error occurred during sign in. Please try again.'
}
