import { useState, useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { AppSidebar } from './app-sidebar'
import { MobileNav } from './mobile-nav'
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog'
import { useWorkspace } from '@/hooks/use-workspace'
import { useAuth } from '@/hooks/use-auth'
import { listWorkspacesFn } from '@/server/functions/workspaces'
import { getPreferencesFn } from '@/server/functions/preferences'
import { Skeleton } from '@/components/ui/skeleton'
import { UserInvitations } from '@/components/workspace/user-invitations'

export function AppLayout() {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [loading, setLoading] = useState(true)
  const { workspace, workspaces, setWorkspaces, setWorkspace, setLanguage, setCurrency } = useWorkspace()
  const { currentUser, isLoading: authLoading } = useAuth()


  const fetchWorkspaces = useServerFn(listWorkspacesFn)
  const fetchPreferences = useServerFn(getPreferencesFn)

  useEffect(() => {
    async function loadData() {
      if (authLoading || !currentUser) return

      try {
        const [workspacesResult, prefsResult] = await Promise.all([
          fetchWorkspaces(),
          fetchPreferences(),
        ])

        setWorkspaces(workspacesResult.workspaces)

        // Set global preferences
        if (prefsResult.preferences.defaultLanguage) {
          setLanguage(prefsResult.preferences.defaultLanguage as 'en' | 'uz')
        }
        if (prefsResult.preferences.defaultCurrency) {
          setCurrency(prefsResult.preferences.defaultCurrency as 'USD' | 'UZS')
        }

        // Set default workspace if available
        if (workspacesResult.workspaces.length > 0) {
          const defaultWsId = prefsResult.preferences.defaultWorkspaceId
          const defaultWs = defaultWsId
            ? workspacesResult.workspaces.find((w) => w.$id === defaultWsId)
            : null

          if (!workspace) {
            setWorkspace(defaultWs || workspacesResult.workspaces[0])
          }
        }

      } catch (error) {
        console.error('Failed to load workspaces:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser, authLoading])

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden md:block w-64 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-2 pt-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Show create workspace prompt if no workspaces
  if (workspaces.length === 0) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-background p-4 overflow-y-auto">
          <div className="w-full max-w-md space-y-8 py-8">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
                <svg
                  className="h-8 w-8 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Welcome to BudgetFlow</h1>
              <p className="text-muted-foreground">
                Create your first workspace to start tracking your finances.
                Workspaces help you organize different financial contexts like
                personal, business, or family budgets.
              </p>
              <button
                onClick={() => setShowCreateWorkspace(true)}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create Your First Workspace
              </button>
            </div>

            <UserInvitations
              onUpdate={async () => {
                const result = await fetchWorkspaces()
                setWorkspaces(result.workspaces)
                if (result.workspaces.length > 0) {
                  setWorkspace(result.workspaces[0])
                }
              }}
            />
          </div>
        </div>
        <CreateWorkspaceDialog
          open={showCreateWorkspace}
          onOpenChange={setShowCreateWorkspace}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex h-[100dvh] bg-background relative overflow-hidden">
        {/* Desktop Sidebar - Floating Dock Style */}
        <div className="hidden md:flex h-screen p-4 pr-0 z-20">
          <AppSidebar onCreateWorkspace={() => setShowCreateWorkspace(true)} />
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden block">
          <MobileNav />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto h-full w-full pb-32 md:pb-4 md:pt-4 md:px-4 no-scrollbar">
          <div className="h-full w-full animate-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <CreateWorkspaceDialog
        open={showCreateWorkspace}
        onOpenChange={setShowCreateWorkspace}
      />
    </>
  )
}
