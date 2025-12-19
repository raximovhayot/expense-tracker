import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db, Query } from '@/server/lib/db'
import { authMiddleware } from './auth'
import type { BudgetItems } from '@/server/lib/appwrite.types'

const budgetItemSchema = z.object({
    workspaceId: z.string(),
    year: z.number(),
    month: z.number(),
    categoryId: z.string().optional(),
    recurringExpenseId: z.string().optional(),
    name: z.string(),
    quantityType: z.enum(['fixed', 'unit', 'weight']),
    quantity: z.number(),
    unitPrice: z.number(),
    plannedAmount: z.number(),
    // actualAmount is calculated
    isPurchased: z.boolean().optional(),
    currency: z.string(),
})

const updateBudgetItemSchema = z.object({
    id: z.string(),
    data: z.object({
        name: z.string().optional(),
        quantityType: z.enum(['fixed', 'unit', 'weight']).optional(),
        quantity: z.number().optional(),
        unitPrice: z.number().optional(),
        plannedAmount: z.number().optional(),
        // actualAmount is calculated
        isPurchased: z.boolean().optional(),
        categoryId: z.string().optional(),
    }),
})

export const listBudgetItemsFn = createServerFn({ method: 'GET' })
    .inputValidator((data: { workspaceId: string; year: number; month: number }) => data)
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        const [itemsResponse, transactionsResponse] = await Promise.all([
            db.budgetItems.list([
                Query.equal('workspaceId', [data.workspaceId]),
                Query.equal('year', [data.year]),
                Query.equal('month', [data.month]),
                Query.limit(100),
            ]),
            db.transactions.list([
                Query.equal('workspaceId', [data.workspaceId]),
                Query.isNotNull('budgetItemId'),
                // We could restrict by date here, but strictly relying on details of the linked budget item is safer? 
                // Actually, transactions should be in the same month ideally, but let's just fetch all linked to these budget items if possible.
                // Appwrite doesn't support "in array" for budgetItemId well without multiple queries if list is large.
                // So let's filter by the month to be safe and efficient.
                Query.greaterThanEqual('transactionDate', new Date(data.year, data.month - 1, 1).toISOString()),
                Query.lessThanEqual('transactionDate', new Date(data.year, data.month, 0, 23, 59, 59).toISOString()),
                Query.limit(1000), // High limit to be safe
            ])
        ])

        const spendByItem: Record<string, number> = {}
        transactionsResponse.rows.forEach((t) => {
            if (t.budgetItemId) {
                spendByItem[t.budgetItemId] = (spendByItem[t.budgetItemId] || 0) + (t.type === 'expense' ? t.amount : -t.amount)
            }
        })

        const items = itemsResponse.rows.map(item => ({
            ...item,
            actualAmount: spendByItem[item.$id] || 0
        }))

        return { items, total: itemsResponse.total }
    })

export const createBudgetItemFn = createServerFn({ method: 'POST' })
    .inputValidator(budgetItemSchema)
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        const item = await db.budgetItems.create({
            ...data,
            createdBy: currentUser.$id,
        })

        return { item }
    })

export const updateBudgetItemFn = createServerFn({ method: 'POST' })
    .inputValidator(updateBudgetItemSchema)
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        const item = await db.budgetItems.update(data.id, data.data)
        return { item }
    })

export const deleteBudgetItemFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ id: z.string() }))
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        await db.budgetItems.delete(data.id)
        return { success: true }
    })

export const populateFromRecurringFn = createServerFn({ method: 'POST' })
    .inputValidator((data: { workspaceId: string; year: number; month: number }) => data)
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        // 1. Fetch active recurring expenses
        const recurring = await db.recurringTransactions.list([
            Query.equal('workspaceId', [data.workspaceId]),
            Query.equal('isActive', [true]),
            Query.limit(100),
        ])

        // 2. Fetch existing budget items linked to recurring expenses for this month
        const existingItems = await db.budgetItems.list([
            Query.equal('workspaceId', [data.workspaceId]),
            Query.equal('year', [data.year]),
            Query.equal('month', [data.month]),
            Query.isNotNull('recurringExpenseId'),
            Query.limit(100),
        ])

        const existingRecurringIds = new Set(
            existingItems.rows.map((d) => d.recurringExpenseId),
        )
        const createdItems: BudgetItems[] = []

        for (const expense of recurring.rows) {
            if (!existingRecurringIds.has(expense.$id)) {
                // Check if expense is valid for this period
                const expenseStart = new Date(expense.startDate)
                const periodEnd = new Date(data.year, data.month, 0) // Last day of month

                if (expenseStart <= periodEnd) {
                    // Check end date if exists
                    if (expense.endDate) {
                        const expenseEnd = new Date(expense.endDate)
                        const periodStart = new Date(data.year, data.month - 1, 1)
                        if (expenseEnd < periodStart) continue
                    }

                    // Create budget item
                    const newItem = await db.budgetItems.create({
                        workspaceId: data.workspaceId,
                        year: data.year,
                        month: data.month,
                        categoryId: expense.categoryId,
                        recurringExpenseId: expense.$id,
                        name: expense.name,
                        quantityType: 'fixed',
                        quantity: 1,
                        unitPrice: expense.amount,
                        plannedAmount: expense.amount,
                        currency: expense.currency,
                        createdBy: currentUser.$id,
                    })
                    createdItems.push(newItem)
                }
            }
        }

        return { created: createdItems.length, items: createdItems }
    })
