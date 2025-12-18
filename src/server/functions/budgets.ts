import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schemas
const createCategorySchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(50),
  icon: z.string().max(50).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
})

const updateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).optional(),
  icon: z.string().max(50).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
})

const setBudgetSchema = z.object({
  workspaceId: z.string(),
  categoryId: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  plannedAmount: z.number().min(0),
  currency: z.enum(['USD', 'UZS']),
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

// List budget categories
export const listCategoriesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ workspaceId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id)

    const categories = await db.budgetCategories.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.orderAsc('name'),
    ])

    return { categories: categories.rows }
  })

// Create category
export const createCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(createCategorySchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    const category = await db.budgetCategories.create({
      createdBy: currentUser.$id,
      workspaceId: data.workspaceId,
      name: data.name.trim(),
      icon: data.icon || null,
      color: data.color || '#9B87F5',
      isDefault: false,
    })

    return { category }
  })

// Update category
export const updateCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(updateCategorySchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.budgetCategories.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name.trim()
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.color !== undefined) updateData.color = data.color

    const category = await db.budgetCategories.update(data.id, updateData)
    return { category }
  })

// Delete category
export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.budgetCategories.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    // Delete associated budgets
    const budgets = await db.monthlyBudgets.list([
      Query.equal('categoryId', [data.id]),
    ])

    await Promise.all(budgets.rows.map((b) => db.monthlyBudgets.delete(b.$id)))

    await db.budgetCategories.delete(data.id)
    return { success: true }
  })

// List monthly budgets
export const listMonthlyBudgetsFn = createServerFn({ method: 'GET' })
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

    const budgets = await db.monthlyBudgets.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('year', [data.year]),
      Query.equal('month', [data.month]),
    ])

    return { budgets: budgets.rows }
  })

// Set monthly budget (create or update)
export const setBudgetFn = createServerFn({ method: 'POST' })
  .inputValidator(setBudgetSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    // Check if budget exists
    const existing = await db.monthlyBudgets.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('categoryId', [data.categoryId]),
      Query.equal('year', [data.year]),
      Query.equal('month', [data.month]),
    ])

    let budget
    if (existing.rows.length > 0) {
      budget = await db.monthlyBudgets.update(existing.rows[0].$id, {
        plannedAmount: data.plannedAmount,
        currency: data.currency,
      })
    } else {
      budget = await db.monthlyBudgets.create({
        createdBy: currentUser.$id,
        workspaceId: data.workspaceId,
        categoryId: data.categoryId,
        year: data.year,
        month: data.month,
        plannedAmount: data.plannedAmount,
        currency: data.currency,
      })
    }

    return { budget }
  })

// Delete monthly budget
export const deleteBudgetFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.monthlyBudgets.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    await db.monthlyBudgets.delete(data.id)
    return { success: true }
  })

// Get budget overview with spending
export const getBudgetOverviewFn = createServerFn({ method: 'GET' })
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

    // Get categories
    const categories = await db.budgetCategories.list([
      Query.equal('workspaceId', [data.workspaceId]),
    ])

    // Get budgets for this month
    const budgets = await db.monthlyBudgets.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('year', [data.year]),
      Query.equal('month', [data.month]),
    ])

    // Get transactions for this month
    const startDate = new Date(data.year, data.month - 1, 1).toISOString()
    const endDate = new Date(data.year, data.month, 0, 23, 59, 59).toISOString()

    const transactions = await db.transactions.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('type', ['expense']),
      Query.greaterThanEqual('transactionDate', startDate),
      Query.lessThanEqual('transactionDate', endDate),
    ])

    // Calculate spending per category
    const spendingByCategory: Record<string, number> = {}
    transactions.rows.forEach((t) => {
      if (t.categoryId) {
        spendingByCategory[t.categoryId] =
          (spendingByCategory[t.categoryId] || 0) + t.amount
      }
    })

    // Build overview
    const overview = categories.rows.map((cat) => {
      const budget = budgets.rows.find((b) => b.categoryId === cat.$id)
      const spent = spendingByCategory[cat.$id] || 0
      const planned = budget?.plannedAmount || 0

      return {
        category: cat,
        planned,
        spent,
        remaining: planned - spent,
        percentage: planned > 0 ? Math.round((spent / planned) * 100) : 0,
        isOverBudget: spent > planned && planned > 0,
      }
    })

    const totalPlanned = overview.reduce((sum, o) => sum + o.planned, 0)
    const totalSpent = overview.reduce((sum, o) => sum + o.spent, 0)

    return {
      overview,
      summary: {
        totalPlanned,
        totalSpent,
        totalRemaining: totalPlanned - totalSpent,
        overallPercentage:
          totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0,
      },
    }
  })

// Copy budgets from previous month
export const copyBudgetsFromPreviousMonthFn = createServerFn({ method: 'POST' })
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

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    // Calculate previous month
    let prevYear = data.year
    let prevMonth = data.month - 1
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear -= 1
    }

    // Get previous month's budgets
    const prevBudgets = await db.monthlyBudgets.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('year', [prevYear]),
      Query.equal('month', [prevMonth]),
    ])

    if (prevBudgets.rows.length === 0) {
      throw new Error('No budgets found in previous month')
    }

    // Create budgets for current month
    const created = []
    for (const budget of prevBudgets.rows) {
      // Check if already exists
      const existing = await db.monthlyBudgets.list([
        Query.equal('workspaceId', [data.workspaceId]),
        Query.equal('categoryId', [budget.categoryId]),
        Query.equal('year', [data.year]),
        Query.equal('month', [data.month]),
      ])

      if (existing.rows.length === 0) {
        const newBudget = await db.monthlyBudgets.create({
          createdBy: currentUser.$id,
          workspaceId: data.workspaceId,
          categoryId: budget.categoryId,
          year: data.year,
          month: data.month,
          plannedAmount: budget.plannedAmount,
          currency: budget.currency,
        })
        created.push(newBudget)
      }
    }

    return { created, count: created.length }
  })
