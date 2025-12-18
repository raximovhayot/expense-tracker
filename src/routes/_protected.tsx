/**
 * Protected Routes Layout
 * Requires authentication to access
 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { authMiddleware } from '@/server/functions/auth'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const { currentUser } = await authMiddleware()
    console.log('[Route: Protected] beforeLoad for:', currentUser?.email || 'NULL', 'at:', location.pathname)

    if (!currentUser) {
      console.log('[Route: Protected] No user found, redirecting to /sign-in')
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.pathname },
      })
    }

    return { currentUser }
  },

  component: () => <AppLayout />,

  pendingComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  ),

  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">
          {error?.message || 'You need to be signed in to access this page.'}
        </p>
        <a
          href="/sign-in"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Sign In
        </a>
      </div>
    </div>
  ),
})
