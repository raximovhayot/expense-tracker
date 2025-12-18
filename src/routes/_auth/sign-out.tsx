/**
 * Sign Out Page
 * Clears both client and server sessions
 */
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { signOut as clientSignOut } from '@/lib/appwrite-client'
import { useServerFn } from '@tanstack/react-start'
import { clearSessionFn } from '@/server/functions/auth'

export const Route = createFileRoute('/_auth/sign-out')({
  component: SignOutPage,
})

function SignOutPage() {
  const [isLoading] = useState(true)
  const clearSession = useServerFn(clearSessionFn)

  useEffect(() => {
    async function handleSignOut() {
      try {
        // Clear client session
        await clientSignOut()

        // Clear server session
        await clearSession()
      } catch (error) {
        console.error('[Sign Out] Error:', error)
      } finally {
        // Always redirect to sign-in
        window.location.href = '/sign-in'
      }
    }

    handleSignOut()
  }, [clearSession])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Signing out...</h2>
        </div>
      </div>
    )
  }

  return null
}
