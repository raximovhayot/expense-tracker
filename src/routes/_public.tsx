/**
 * Public Routes Layout
 * Accessible to everyone
 * Loads user session for components that need it
 */
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { authMiddleware } from '@/server/functions/auth'

export const Route = createFileRoute('/_public')({
  loader: async () => {
    // Load user for public pages (landing page shows different UI for logged in users)
    const { currentUser } = await authMiddleware()
    return { currentUser }
  },
  component: () => <Outlet />,
})
