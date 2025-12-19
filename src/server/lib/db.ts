/**
 * Database Access Layer
 * Uses Appwrite Databases API
 */
import {
  Client,
  Databases,
  ID,
  type Models,
  Permission,
  Role,
  Query,
} from 'node-appwrite'
import type {
  Workspaces,
  WorkspaceMembers,
  WorkspaceInvitations,
  BudgetCategories,
  MonthlyBudgets,
  Transactions,
  RecurringTransactions,
  UserPreferences,
  ExchangeRates,
  Debts,
  BudgetItems,
} from './appwrite.types'

// Initialize client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(client)
const DATABASE_ID = process.env.APPWRITE_DB_ID!

// =============================================================================
// GENERIC CRUD HELPERS
// =============================================================================

interface ListResponse<T> {
  total: number
  rows: T[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createCollectionClient<T extends Models.Document>(collectionId: string) {
  return {
    create: async (
      data: Record<string, unknown>,
      options?: { rowId?: string; permissions?: string[] }
    ): Promise<T> => {
      const userId = data.createdBy as string | undefined
      const permissions = options?.permissions || (userId ? [
        Permission.read(Role.user(userId)),
        Permission.write(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ] : [])

      const result = await databases.createDocument(
        DATABASE_ID,
        collectionId,
        options?.rowId || ID.unique(),
        data,
        permissions
      )
      return result as unknown as T
    },

    get: async (id: string): Promise<T> => {
      const result = await databases.getDocument(DATABASE_ID, collectionId, id)
      return result as unknown as T
    },

    update: async (
      id: string,
      data: Record<string, unknown>,
      options?: { permissions?: string[] }
    ): Promise<T> => {
      const result = await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        id,
        data,
        options?.permissions
      )
      return result as unknown as T
    },

    delete: async (id: string): Promise<void> => {
      await databases.deleteDocument(DATABASE_ID, collectionId, id)
    },

    list: async (queries?: string[]): Promise<ListResponse<T>> => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        collectionId,
        queries
      )
      return {
        total: result.total,
        rows: result.documents as unknown as T[],
      }
    },
  }
}

// =============================================================================
// COLLECTION CLIENTS
// =============================================================================

export const db = {
  workspaces: createCollectionClient<Workspaces>('workspaces'),
  workspaceMembers: createCollectionClient<WorkspaceMembers>('workspace_members'),
  workspaceInvitations: createCollectionClient<WorkspaceInvitations>('workspace_invitations'),
  budgetCategories: createCollectionClient<BudgetCategories>('budget_categories'),
  monthlyBudgets: createCollectionClient<MonthlyBudgets>('monthly_budgets'),
  transactions: createCollectionClient<Transactions>('transactions'),
  recurringTransactions: createCollectionClient<RecurringTransactions>('recurring_expenses'),
  userPreferences: createCollectionClient<UserPreferences>('user_preferences'),
  exchangeRates: createCollectionClient<ExchangeRates>('exchange_rates'),
  debts: createCollectionClient<Debts>('debts'),
  budgetItems: createCollectionClient<BudgetItems>('budget_items'),
}

// Re-export Query for convenience
export { Query }
