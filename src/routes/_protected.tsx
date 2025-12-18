import { redirect, createFileRoute } from '@tanstack/react-router'
import { authMiddleware } from '@/server/functions/auth'
import { AppLayout } from '@/components/layout/app-layout'

export const Route = createFileRoute('/_protected')({
  loader: async ({ location }) => {
    const { currentUser } = await authMiddleware()

    if (!currentUser) {
      // Store the intended destination for post-login redirect
      const redirectTo = location.href !== '/sign-in' ? location.href : undefined

      throw redirect({
        to: '/sign-in',
        search: redirectTo ? { redirect: redirectTo } : undefined
      })
    }

    return {
      currentUser,
    }
  },

  component: ProtectedLayout,

  // Show loading state while checking auth
  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  ),

  // Handle auth errors gracefully
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-destructive">
          Access Denied
        </h1>
        <p className="text-muted-foreground">
          {error?.message || 'You need to be signed in to access this page.'}
        </p>
        <a
          href="/sign-in"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Sign In
        </a>
      </div>
    </div>
  ),
})

function ProtectedLayout() {
  return <AppLayout />
}
