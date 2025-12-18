import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { completeOAuthFn } from '@/server/functions/auth'

const searchSchema = z.object({
  userId: z.string().optional(),
  secret: z.string().optional(),
})

export const Route = createFileRoute('/oauth-callback')({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  loader: async (ctx: any) => {
    // 1. Log what the router sees
    console.log('[OAuth Callback] Loader Context Keys:', Object.keys(ctx))
    const search = ctx.search || {}
    console.log('[OAuth Callback] Search Params:', search)

    // 2. Extract credentials
    const { userId, secret } = search

    // 3. If missing, we can't do anything on the server
    if (!userId || !secret) {
      console.error('[OAuth Callback] Missing userId or secret')
      return { success: false, error: 'Missing OAuth credentials' }
    }

    // 4. Exchange for session cookies
    try {
      await completeOAuthFn({ data: { userId, secret } })
      // 5. Success! Redirect to dashboard (or home)
      throw redirect({ to: '/' })
    } catch (error) {
      // If it was a redirect (success), let it pass
      if (error instanceof Response || (typeof error === 'object' && error !== null && 'headers' in error)) {
        throw error
      }
      console.error('[OAuth Callback] Failed to create session:', error)
      return { success: false, error: 'Failed to create session' }
    }
  },
  component: OAuthCallbackErrorComponent,
})

function OAuthCallbackErrorComponent() {
  const data = Route.useLoaderData() as { success: boolean; error: string }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
      <p>{data.error || 'Unknown error occurred.'}</p>
      <a href="/sign-in" className="underline text-primary">Return to Sign In</a>
    </div>
  )
}
