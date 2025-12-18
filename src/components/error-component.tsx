import { useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './ui/button'

export function ErrorComponent({
  error,
  info,
  reset,
}: {
  error: Error
  info?: { componentStack: string }
  reset: () => void
}) {
  const randomErrorId = useRef<string>(
    Math.random().toString(36).substring(2, 15),
  )
  const location = useLocation()

  const message = {
    type: 'NOTIFY_ERROR',
    data: {
      errorId: randomErrorId.current,
      href: location.href,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCause: error.cause,
      errorComponentStack: info?.componentStack,
    },
  }

  // Every 2 seconds, notify parent that an error exists
  useEffect(() => {
    const interval = setInterval(() => {
      window.parent.postMessage(message)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-grow flex flex-col justify-center items-center gap-6 text-center p-8">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Oops! Something went wrong.
        </h1>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
      </div>

      <div className="w-full max-w-md">
        <pre className="text-xs border border-destructive/30 bg-destructive/5 p-3 text-destructive overflow-auto rounded-md text-left">
          {error.message ? <code>{error.message}</code> : 'Unknown error'}
        </pre>
      </div>

      <Button onClick={reset} variant="outline">
        Try Again
      </Button>
    </div>
  )
}
