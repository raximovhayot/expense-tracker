import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'
import { addMonths, addYears, addWeeks } from 'date-fns'

// Schemas
const createRecurringSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  categoryId: z.string().nullable().optional(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'UZS']),
  frequency: z.enum([
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'annual',
    'one_time',
  ]),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional(),
})

const updateRecurringSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  categoryId: z.string().nullable().optional(),
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(['USD', 'UZS']).optional(),
  frequency: z
    .enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual', 'one_time'])
    .optional(),
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

// List recurring transactions
export const listRecurringTransactionsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ workspaceId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id)

    const recurring = await db.recurringTransactions.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.orderDesc('createdAt'),
    ])

    return { recurring: recurring.rows }
  })

// Get single recurring transaction
export const getRecurringTransactionFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const recurring = await db.recurringTransactions.get(data.id)
    await verifyWorkspaceAccess(recurring.workspaceId, currentUser.$id)

    return { recurring }
  })

// Create recurring transaction
export const createRecurringTransactionFn = createServerFn({ method: 'POST' })
  .inputValidator(createRecurringSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    const recurring = await db.recurringTransactions.create({
      createdBy: currentUser.$id,
      workspaceId: data.workspaceId,
      name: data.name.trim(),
      categoryId: data.categoryId || null,
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate || null,
      nextDueDate: data.startDate, // Initial next due date is start date
      lastProcessedDate: null,
      isActive: data.isActive,
      notes: data.notes?.trim() || null,
    })

    return { recurring }
  })

// Update recurring transaction
export const updateRecurringTransactionFn = createServerFn({ method: 'POST' })
  .inputValidator(updateRecurringSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.recurringTransactions.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name.trim()
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.type) updateData.type = data.type
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.currency) updateData.currency = data.currency
    if (data.frequency) updateData.frequency = data.frequency
    if (data.startDate) updateData.startDate = data.startDate
    if (data.endDate !== undefined) updateData.endDate = data.endDate
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null

    const recurring = await db.recurringTransactions.update(data.id, updateData)
    return { recurring }
  })

// Process due recurring transactions
export const processDueTransactionsFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ workspaceId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    const today = new Date().toISOString()

    // Find due transactions
    const dueTransactions = await db.recurringTransactions.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('isActive', [true]),
      Query.lessThanEqual('nextDueDate', today),
    ])

    let processedCount = 0

    for (const recurring of dueTransactions.rows) {
      // Create transaction
      await db.transactions.create({
        createdBy: currentUser.$id,
        workspaceId: data.workspaceId,
        type: recurring.type,
        amount: recurring.amount,
        currency: recurring.currency,
        categoryId: recurring.categoryId,
        description: `Recurring: ${recurring.name}`,
        transactionDate: recurring.nextDueDate,
        recurringExpenseId: recurring.$id,
      })

      // Calculate next due date
      const currentDue = new Date(recurring.nextDueDate)
      let nextDue = currentDue

      switch (recurring.frequency) {
        case 'weekly':
          nextDue = addWeeks(currentDue, 1)
          break
        case 'biweekly':
          nextDue = addWeeks(currentDue, 2)
          break
        case 'monthly':
          nextDue = addMonths(currentDue, 1)
          break
        case 'quarterly':
          nextDue = addMonths(currentDue, 3)
          break
        case 'annual':
          nextDue = addYears(currentDue, 1)
          break
        case 'one_time':
          // For one-time, we can deactivate it or set next due date far in future?
          // Or just deactivate it.
          await db.recurringTransactions.update(recurring.$id, {
            isActive: false,
            lastProcessedDate: today,
          })
          processedCount++
          continue
      }

      // Check if past end date
      if (recurring.endDate && nextDue > new Date(recurring.endDate)) {
        await db.recurringTransactions.update(recurring.$id, {
          isActive: false,
          lastProcessedDate: today,
        })
      } else {
        await db.recurringTransactions.update(recurring.$id, {
          nextDueDate: nextDue.toISOString(),
          lastProcessedDate: today,
        })
      }

      processedCount++
    }

    return { count: processedCount }
  })

// Delete recurring transaction
export const deleteRecurringTransactionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.recurringTransactions.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    await db.recurringTransactions.delete(data.id)
    return { success: true }
  })

// Toggle recurring transaction active status
export const toggleRecurringTransactionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.recurringTransactions.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    const recurring = await db.recurringTransactions.update(data.id, {
      isActive: !existing.isActive,
    })

    return { recurring }
  })
