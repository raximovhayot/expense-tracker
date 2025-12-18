import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspaces } from '@/server/lib/appwrite.types'
import type { Language } from '@/lib/i18n'
import type { Currency } from '@/lib/currency'

interface WorkspaceWithRole extends Workspaces {
  userRole: string
}

interface WorkspaceState {
  currentWorkspace: WorkspaceWithRole | null
  workspaces: WorkspaceWithRole[]
  setCurrentWorkspace: (workspace: WorkspaceWithRole | null) => void
  setWorkspaces: (workspaces: WorkspaceWithRole[]) => void
  addWorkspace: (workspace: WorkspaceWithRole) => void
  updateWorkspace: (id: string, updates: Partial<WorkspaceWithRole>) => void
  removeWorkspace: (id: string) => void
  getLanguage: () => Language
  getCurrency: () => Currency
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentWorkspace: null,
      workspaces: [],

      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

      setWorkspaces: (workspaces) => {
        const current = get().currentWorkspace
        // If current workspace is no longer in list, clear it
        if (current && !workspaces.find((w) => w.$id === current.$id)) {
          set({ workspaces, currentWorkspace: workspaces[0] || null })
        } else {
          set({ workspaces })
        }
      },

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          currentWorkspace: state.currentWorkspace || workspace,
        })),

      updateWorkspace: (id, updates) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.$id === id ? { ...w, ...updates } : w,
          ),
          currentWorkspace:
            state.currentWorkspace?.$id === id
              ? { ...state.currentWorkspace, ...updates }
              : state.currentWorkspace,
        })),

      removeWorkspace: (id) =>
        set((state) => {
          const newWorkspaces = state.workspaces.filter((w) => w.$id !== id)
          return {
            workspaces: newWorkspaces,
            currentWorkspace:
              state.currentWorkspace?.$id === id
                ? newWorkspaces[0] || null
                : state.currentWorkspace,
          }
        }),

      getLanguage: () => {
        const workspace = get().currentWorkspace
        return (workspace?.language as Language) || 'en'
      },

      getCurrency: () => {
        const workspace = get().currentWorkspace
        return (workspace?.currency as Currency) || 'USD'
      },
    }),
    {
      name: 'budgetflow-workspace',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
      }),
    },
  ),
)

// Hook for easy access
export function useWorkspace() {
  const store = useWorkspaceStore()

  return {
    workspace: store.currentWorkspace,
    workspaces: store.workspaces,
    setWorkspace: store.setCurrentWorkspace,
    setWorkspaces: store.setWorkspaces,
    addWorkspace: store.addWorkspace,
    updateWorkspace: store.updateWorkspace,
    removeWorkspace: store.removeWorkspace,
    language: store.getLanguage(),
    currency: store.getCurrency(),
    isOwner: store.currentWorkspace?.userRole === 'owner',
    isEditor:
      store.currentWorkspace?.userRole === 'owner' ||
      store.currentWorkspace?.userRole === 'editor',
    canEdit: store.currentWorkspace?.userRole !== 'viewer',
  }
}
