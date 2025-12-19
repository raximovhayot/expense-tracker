import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schemas
const createTransactionSchema = z.object({
  workspaceId: z.string(),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().nullable().optional(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'UZS']),
  convertedAmount: z.number().nullable().optional(),
  exchangeRate: z.number().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  transactionDate: z.string(),
  recurringExpenseId: z.string().nullable().optional(),
  debtId: z.string().nullable().optional(),
  budgetItemId: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
})

const updateTransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().nullable().optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(['USD', 'UZS']).optional(),
  convertedAmount: z.number().nullable().optional(),
  exchangeRate: z.number().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  transactionDate: z.string().optional(),
  recurringExpenseId: z.string().nullable().optional(),
  debtId: z.string().nullable().optional(),
  budgetItemId: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
})

const listTransactionsSchema = z.object({
  workspaceId: z.string(),
  type: z.enum(['income', 'expense', 'all']).optional(),
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
})

// Helper to verify workspace access
async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string,
  requireEdit = false,
) {
  const memberships = await db.workspaceMembers.list([
    Query.equal('workspaceId', [workspaceId]),
    Query.equal('userId', [userId]),
  ])

  if (memberships.rows.length === 0) {
    throw new Error('Access denied')
  }

  if (requireEdit && memberships.rows[0].role === 'viewer') {
    throw new Error('You do not have permission to edit')
  }

  return memberships.rows[0]
}

// List transactions
export const listTransactionsFn = createServerFn({ method: 'GET' })
  .inputValidator(listTransactionsSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id)

    const queries: string[] = [
      Query.equal('workspaceId', [data.workspaceId]),
      Query.orderDesc('transactionDate'),
    ]

    if (data.type && data.type !== 'all') {
      queries.push(Query.equal('type', [data.type]))
    }

    if (data.categoryId) {
      queries.push(Query.equal('categoryId', [data.categoryId]))
    }

    if (data.startDate) {
      queries.push(Query.greaterThanEqual('transactionDate', data.startDate))
    }

    if (data.endDate) {
      queries.push(Query.lessThanEqual('transactionDate', data.endDate))
    }

    if (data.limit) {
      queries.push(Query.limit(data.limit))
    }

    if (data.offset) {
      queries.push(Query.offset(data.offset))
    }

    const transactions = await db.transactions.list(queries)
    return { transactions: transactions.rows, total: transactions.total }
  })

// Get single transaction
export const getTransactionFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const transaction = await db.transactions.get(data.id)
    await verifyWorkspaceAccess(transaction.workspaceId, currentUser.$id)

    return { transaction }
  })

// Create transaction
export const createTransactionFn = createServerFn({ method: 'POST' })
  .inputValidator(createTransactionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    const transaction = await db.transactions.create({
      createdBy: currentUser.$id,
      workspaceId: data.workspaceId,
      type: data.type,
      categoryId: data.categoryId || null,
      amount: data.amount,
      currency: data.currency,
      convertedAmount: data.convertedAmount || null,
      exchangeRate: data.exchangeRate || null,
      description: data.description?.trim() || null,
      transactionDate: data.transactionDate,
      recurringExpenseId: data.recurringExpenseId || null,
      debtId: data.debtId || null,
      budgetItemId: data.budgetItemId || null,
      tags: data.tags || null,
    })

    return { transaction }
  })

// Update transaction
export const updateTransactionFn = createServerFn({ method: 'POST' })
  .inputValidator(updateTransactionSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.transactions.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    const updateData: Record<string, unknown> = {}
    if (data.type) updateData.type = data.type
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId

    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.currency) updateData.currency = data.currency
    if (data.convertedAmount !== undefined)
      updateData.convertedAmount = data.convertedAmount
    if (data.exchangeRate !== undefined)
      updateData.exchangeRate = data.exchangeRate
    if (data.description !== undefined)
      updateData.description = data.description?.trim() || null
    if (data.transactionDate) updateData.transactionDate = data.transactionDate
    if (data.budgetItemId !== undefined) updateData.budgetItemId = data.budgetItemId
    if (data.tags !== undefined) updateData.tags = data.tags

    const transaction = await db.transactions.update(data.id, updateData)
    return { transaction }
  })

// Delete transaction
export const deleteTransactionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.transactions.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    await db.transactions.delete(data.id)
    return { success: true }
  })

// Get transaction summary for dashboard
export const getTransactionSummaryFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      workspaceId: z.string(),
      year: z.number().int(),
      month: z.number().int(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id)

    const startDate = new Date(data.year, data.month - 1, 1).toISOString()
    const endDate = new Date(data.year, data.month, 0, 23, 59, 59).toISOString()

    const transactions = await db.transactions.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.greaterThanEqual('transactionDate', startDate),
      Query.lessThanEqual('transactionDate', endDate),
    ])

    let totalIncome = 0
    let totalExpenses = 0
    const incomeBySource: Record<string, number> = {}
    const expensesByCategory: Record<string, number> = {}

    transactions.rows.forEach((t) => {
      if (t.categoryId) {
        if (t.type === 'income') {
          totalIncome += t.amount
          incomeBySource[t.categoryId] =
            (incomeBySource[t.categoryId] || 0) + t.amount
        } else {
          totalExpenses += t.amount
          expensesByCategory[t.categoryId] =
            (expensesByCategory[t.categoryId] || 0) + t.amount
        }
      } else {
        if (t.type === 'income') {
          totalIncome += t.amount
        } else {
          totalExpenses += t.amount
        }
      }
    })

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: transactions.rows.length,
      incomeBySource,
      expensesByCategory,
    }
  })

// Get recent transactions
export const getRecentTransactionsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      workspaceId: z.string(),
      limit: z.number().int().min(1).max(20).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id)

    const transactions = await db.transactions.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.orderDesc('transactionDate'),
      Query.limit(data.limit || 5),
    ])

    return { transactions: transactions.rows }
  })
