import { redirect } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { authMiddleware } from '@/server/functions/auth'
import { AppLayout } from '@/components/layout/app-layout'

export const Route = createFileRoute('/_protected')({
  loader: async ({ location }) => {
    const { currentUser } = await authMiddleware()

    if (!currentUser) {
      if (location.pathname !== '/sign-in') {
        throw redirect({ to: '/sign-in', search: { redirect: location.href } })
      }
    }

    return {
      currentUser,
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return <AppLayout />
}
