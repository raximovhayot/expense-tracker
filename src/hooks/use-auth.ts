import { signOutFn } from '@/server/functions/auth'
import { useLoaderData } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

export function useAuth() {
  // Try to get currentUser from root loader
  let currentUser = null
  try {
    const rootData = useLoaderData({ from: '__root__' })
    currentUser = rootData?.currentUser
  } catch {
    // Fallback - might be in a different route context
  }

  const signOut = useServerFn(signOutFn)

  return {
    currentUser,
    signOut,
  }
}
