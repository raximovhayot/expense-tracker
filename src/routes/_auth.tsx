import { getCurrentUser } from '@/server/functions/auth'
import { redirect, Outlet } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  loader: async ({ location }) => {
    const currentUser = await getCurrentUser()

    // If user is already logged in and not trying to sign out, 
    // redirect to home
    if (currentUser && location.pathname !== '/sign-out') {
      throw redirect({ to: '/' })
    }

    return {
      currentUser,
    }
  },

  component: AuthLayout,
})

function AuthLayout() {
  return <Outlet />
}
