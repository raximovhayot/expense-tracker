import { getCurrentUser } from '@/server/functions/auth'
import { redirect, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  loader: async ({ location }) => {
    const currentUser = await getCurrentUser()

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
