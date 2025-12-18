import { createFileRoute, redirect } from '@tanstack/react-router'
import { signOutFn } from '@/server/functions/auth'

export const Route = createFileRoute('/_auth/sign-out')({
  loader: async () => {
    // Perform sign out on the server
    await signOutFn()

    // This should not be reached as signOutFn throws a redirect
    // But just in case, redirect to home
    throw redirect({ to: '/' })
  },

  // Show a brief loading state while signing out
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Signing out...</p>
      </div>
    </div>
  ),
})
