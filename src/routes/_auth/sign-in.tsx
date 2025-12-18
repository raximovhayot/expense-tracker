import { createFileRoute } from '@tanstack/react-router'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { useServerFn } from '@tanstack/react-start'
import { signInWithGoogleFn } from '@/server/functions/auth'

export const Route = createFileRoute('/_auth/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  // Get the server function
  const signInWithGoogle = useServerFn(signInWithGoogleFn)

  const handleSignIn = async () => {
    try {
      await signInWithGoogle({ data: { redirect: undefined } })
    } catch (error) {
      // Redirects are thrown as errors in Tanstack Start
      // If it's not a redirect, log it
      console.error('Sign in error:', error)
    }
  }

  return (
    <AuthCard
      title="Welcome Back"
      description="Select your Google account to access your personal expense tracker"
    >
      <div className="flex flex-col space-y-4 py-4">
        <Button
          variant="outline"
          type="button"
          className="w-full h-12 text-base font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center justify-center gap-3 border-2"
          onClick={handleSignIn}
        >
          <svg className="h-5 w-5" viewBox="0 0 488 512">
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            />
          </svg>
          Continue with Google
        </Button>
      </div>
      <div className="text-center text-xs text-muted-foreground mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </div>
    </AuthCard>
  )
}
