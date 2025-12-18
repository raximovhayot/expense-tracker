/**
 * Auth Layout
 * For sign-in/sign-out pages - redirects if already authenticated
 */
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { authMiddleware } from '@/server/functions/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const { currentUser } = await authMiddleware()
    console.log('[Route: Auth] beforeLoad for:', currentUser?.email || 'NULL', 'at:', location.pathname)

    // If already logged in and not on sign-out page, redirect to home
    if (currentUser && !location.pathname.includes('sign-out')) {
      console.log('[Route: Auth] User already logged in, redirecting to /')
      throw redirect({ to: '/' })
    }

    return {}
  },

  component: () => <Outlet />,
})
