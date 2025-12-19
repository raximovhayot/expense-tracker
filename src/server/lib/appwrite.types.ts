import { type Models } from 'node-appwrite'

export type Workspaces = Models.Document & {
  createdBy: string
  name: string
  description: string | null
}


export type WorkspaceMembers = Models.Document & {
  createdBy: string
  workspaceId: string
  userId: string
  userEmail: string
  role: string
}

export type WorkspaceInvitations = Models.Document & {
  createdBy: string
  workspaceId: string
  email: string
  role: string
  status: string
  invitedBy: string
  expiresAt: string | null
}


export type BudgetCategories = Models.Document & {
  createdBy: string
  workspaceId: string
  name: string
  icon: string | null
  color: string | null
  type: 'income' | 'expense'
  isDefault: boolean
}

export type MonthlyBudgets = Models.Document & {
  createdBy: string
  workspaceId: string
  categoryId: string
  year: number
  month: number
  plannedAmount: number
  currency: string
}

export type Transactions = Models.Document & {
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
  debtId: string | null
  budgetItemId: string | null
  tags: string[] | null
}

export type RecurringTransactions = Models.Document & {
  createdBy: string
  workspaceId: string
  name: string
  categoryId: string | null
  type: 'income' | 'expense'
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

export type UserPreferences = Models.Document & {
  createdBy: string
  defaultWorkspaceId: string | null
  defaultLanguage: string | null
  defaultCurrency: string | null
  theme: string | null
  notificationsEnabled: boolean
  emailNotifications: boolean
}

export type ExchangeRates = Models.Document & {
  createdBy: string
  fromCurrency: string
  toCurrency: string
  rate: number
  fetchedAt: string
}

export type Debts = Models.Document & {
  createdBy: string
  workspaceId: string
  type: 'lent' | 'borrowed'
  personName: string
  amount: number
  currency: string
  description: string | null
  dueDate: string | null
  isPaid: boolean
  notes: string | null
}

export type BudgetItems = Models.Document & {
  createdBy: string
  workspaceId: string
  year: number
  month: number
  categoryId: string | null
  recurringExpenseId: string | null
  name: string
  quantityType: 'fixed' | 'unit' | 'weight'
  quantity: number
  unitPrice: number
  plannedAmount: number
  actualAmount: number | null
  isPurchased: boolean
  currency: string
}

export type IncomeSources = Models.Document & {
  createdBy: string
  workspaceId: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isActive: boolean
  notes: string | null
  frequency: string
  currency: string
  amount: number
  type: string
}
