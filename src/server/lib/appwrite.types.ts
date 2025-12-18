import { type Models } from 'node-appwrite'

export type Workspaces = Models.Row & {
  createdBy: string
  name: string
  description: string | null
  currency: string
  language: string
  memberCount: number
}

export type WorkspaceMembers = Models.Row & {
  createdBy: string
  workspaceId: string
  userId: string
  userEmail: string
  role: string
}

export type WorkspaceInvitations = Models.Row & {
  createdBy: string
  workspaceId: string
  email: string
  role: string
  status: string
  invitedBy: string
  expiresAt: string | null
}

export type IncomeSources = Models.Row & {
  createdBy: string
  workspaceId: string
  name: string
  type: string
  amount: number
  currency: string
  frequency: string
  isActive: boolean
  notes: string | null
}

export type BudgetCategories = Models.Row & {
  createdBy: string
  workspaceId: string
  name: string
  icon: string | null
  color: string | null
  isDefault: boolean
}

export type MonthlyBudgets = Models.Row & {
  createdBy: string
  workspaceId: string
  categoryId: string
  year: number
  month: number
  plannedAmount: number
  currency: string
}

export type Transactions = Models.Row & {
  createdBy: string
  workspaceId: string
  type: string
  categoryId: string | null
  incomeSourceId: string | null
  amount: number
  currency: string
  convertedAmount: number | null
  exchangeRate: number | null
  description: string | null
  transactionDate: string
  recurringExpenseId: string | null
  tags: string[] | null
}

export type RecurringExpenses = Models.Row & {
  createdBy: string
  workspaceId: string
  name: string
  categoryId: string
  amount: number
  currency: string
  frequency: string
  startDate: string
  endDate: string | null
  nextDueDate: string
  lastProcessedDate: string | null
  isActive: boolean
  notes: string | null
}

export type UserPreferences = Models.Row & {
  createdBy: string
  defaultWorkspaceId: string | null
  defaultLanguage: string | null
  defaultCurrency: string | null
  theme: string | null
  notificationsEnabled: boolean
  emailNotifications: boolean
}

export type ExchangeRates = Models.Row & {
  createdBy: string
  fromCurrency: string
  toCurrency: string
  rate: number
  fetchedAt: string
}
