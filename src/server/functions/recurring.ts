import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schemas
const createRecurringSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  categoryId: z.string(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'UZS']),
  frequency: z.enum(['monthly', 'quarterly', 'annual']),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional(),
})

const updateRecurringSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  categoryId: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(['USD', 'UZS']).optional(),
  frequency: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
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

// Calculate next due date based on frequency
function calculateNextDueDate(
  startDate: string,
  frequency: string,
  lastProcessed?: string | null,
): string {
  const now = new Date()
  const next = new Date(lastProcessed || startDate)

  while (next <= now) {
    switch (frequency) {
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
      case 'quarterly':
        next.setMonth(next.getMonth() + 3)
        break
      case 'annual':
        next.setFullYear(next.getFullYear() + 1)
        break
    }
  }

  return next.toISOString()
}

// List recurring expenses
export const listRecurringExpensesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ workspaceId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id)

    const expenses = await db.recurringExpenses.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.orderAsc('nextDueDate'),
    ])

    return { expenses: expenses.rows }
  })

// Get single recurring expense
export const getRecurringExpenseFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const expense = await db.recurringExpenses.get(data.id)
    await verifyWorkspaceAccess(expense.workspaceId, currentUser.$id)

    return { expense }
  })

// Create recurring expense
export const createRecurringExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(createRecurringSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    const nextDueDate = calculateNextDueDate(data.startDate, data.frequency)

    const expense = await db.recurringExpenses.create({
      createdBy: currentUser.$id,
      workspaceId: data.workspaceId,
      name: data.name.trim(),
      categoryId: data.categoryId,
      amount: data.amount,
      currency: data.currency,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate || null,
      nextDueDate,
      lastProcessedDate: null,
      isActive: data.isActive,
      notes: data.notes?.trim() || null,
    })

    return { expense }
  })

// Update recurring expense
export const updateRecurringExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(updateRecurringSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.recurringExpenses.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name.trim()
    if (data.categoryId) updateData.categoryId = data.categoryId
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.currency) updateData.currency = data.currency
    if (data.frequency) updateData.frequency = data.frequency
    if (data.startDate) updateData.startDate = data.startDate
    if (data.endDate !== undefined) updateData.endDate = data.endDate
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null

    // Recalculate next due date if frequency or start date changed
    if (data.frequency || data.startDate) {
      const frequency = data.frequency || existing.frequency
      const startDate = data.startDate || existing.startDate
      updateData.nextDueDate = calculateNextDueDate(
        startDate,
        frequency,
        existing.lastProcessedDate,
      )
    }

    const expense = await db.recurringExpenses.update(data.id, updateData)
    return { expense }
  })

// Delete recurring expense
export const deleteRecurringExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.recurringExpenses.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    await db.recurringExpenses.delete(data.id)
    return { success: true }
  })

// Toggle recurring expense active status
export const toggleRecurringExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.recurringExpenses.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    const expense = await db.recurringExpenses.update(data.id, {
      isActive: !existing.isActive,
    })

    return { expense }
  })

// Process due recurring expenses (create transactions)
export const processDueExpensesFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ workspaceId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    const now = new Date().toISOString()

    // Get all active recurring expenses that are due
    const dueExpenses = await db.recurringExpenses.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('isActive', [true]),
      Query.lessThanEqual('nextDueDate', now),
    ])

    const processed = []

    for (const expense of dueExpenses.rows) {
      // Check if end date has passed
      if (expense.endDate && new Date(expense.endDate) < new Date()) {
        await db.recurringExpenses.update(expense.$id, { isActive: false })
        continue
      }

      // Create transaction
      const transaction = await db.transactions.create({
        createdBy: currentUser.$id,
        workspaceId: data.workspaceId,
        type: 'expense',
        categoryId: expense.categoryId,
        incomeSourceId: null,
        amount: expense.amount,
        currency: expense.currency,
        convertedAmount: null,
        exchangeRate: null,
        description: `Recurring: ${expense.name}`,
        transactionDate: expense.nextDueDate,
        recurringExpenseId: expense.$id,
        tags: ['recurring'],
      })

      // Update recurring expense
      const nextDueDate = calculateNextDueDate(
        expense.startDate,
        expense.frequency,
        expense.nextDueDate,
      )
      await db.recurringExpenses.update(expense.$id, {
        lastProcessedDate: expense.nextDueDate,
        nextDueDate,
      })

      processed.push({ expense, transaction })
    }

    return { processed, count: processed.length }
  })

// Get upcoming recurring expenses
export const getUpcomingExpensesFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      workspaceId: z.string(),
      days: z.number().int().min(1).max(90).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id)

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + (data.days || 30))

    const expenses = await db.recurringExpenses.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('isActive', [true]),
      Query.lessThanEqual('nextDueDate', futureDate.toISOString()),
      Query.orderAsc('nextDueDate'),
    ])

    return { expenses: expenses.rows }
  })
