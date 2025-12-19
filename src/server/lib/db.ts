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
  IncomeSources,
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

import { COLLECTIONS } from './collections'

// ... imports remain the same but we will need to update them properly in the full file context if I were rewriting the whole file, 
// but here I am just touching the `db` object and the helper function.

// Generic helper for collection clients
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
  workspaces: createCollectionClient<Workspaces>(COLLECTIONS.WORKSPACES),
  workspaceMembers: createCollectionClient<WorkspaceMembers>(COLLECTIONS.WORKSPACE_MEMBERS),
  workspaceInvitations: createCollectionClient<WorkspaceInvitations>(COLLECTIONS.WORKSPACE_INVITATIONS),
  budgetCategories: createCollectionClient<BudgetCategories>(COLLECTIONS.BUDGET_CATEGORIES),
  monthlyBudgets: createCollectionClient<MonthlyBudgets>(COLLECTIONS.MONTHLY_BUDGETS),
  transactions: createCollectionClient<Transactions>(COLLECTIONS.TRANSACTIONS),
  recurringTransactions: createCollectionClient<RecurringTransactions>(COLLECTIONS.RECURRING_TRANSACTIONS),
  userPreferences: createCollectionClient<UserPreferences>(COLLECTIONS.USER_PREFERENCES),
  exchangeRates: createCollectionClient<ExchangeRates>(COLLECTIONS.EXCHANGE_RATES),
  debts: createCollectionClient<Debts>(COLLECTIONS.DEBTS),
  budgetItems: createCollectionClient<BudgetItems>(COLLECTIONS.BUDGET_ITEMS),
  incomeSources: createCollectionClient<IncomeSources>(COLLECTIONS.INCOME_SOURCES),
}

// Re-export Query for convenience
export { Query }
