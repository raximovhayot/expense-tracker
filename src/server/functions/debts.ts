import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db, Query } from '../lib/db'
import { authMiddleware } from './auth'

// Schemas
const createDebtSchema = z.object({
    workspaceId: z.string(),
    type: z.enum(['lent', 'borrowed']),
    personName: z.string().min(1, 'Person name is required'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    currency: z.string().length(3),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    isPaid: z.boolean().default(false),
    notes: z.string().optional(),
})

const updateDebtSchema = z.object({
    id: z.string(),
    workspaceId: z.string(),
    type: z.enum(['lent', 'borrowed']).optional(),
    personName: z.string().min(1).optional(),
    amount: z.number().min(0.01).optional(),
    currency: z.string().length(3).optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    isPaid: z.boolean().optional(),
    notes: z.string().optional(),
})

// List debts for a workspace
export const listDebtsFn = createServerFn({ method: 'GET' })
    .inputValidator(z.object({ workspaceId: z.string() }))
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        // Verify membership
        const memberships = await db.workspaceMembers.list([
            Query.equal('workspaceId', [data.workspaceId]),
            Query.equal('userId', [currentUser.$id]),
        ])

        if (memberships.rows.length === 0) {
            throw new Error('Access denied')
        }

        const debts = await db.debts.list([
            Query.equal('workspaceId', [data.workspaceId]),
            Query.orderDesc('$createdAt'),
        ])

        return { debts: debts.rows }
    })

// Create debt
export const createDebtFn = createServerFn({ method: 'POST' })
    .inputValidator(createDebtSchema)
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        // Verify membership (editor or owner)
        const memberships = await db.workspaceMembers.list([
            Query.equal('workspaceId', [data.workspaceId]),
            Query.equal('userId', [currentUser.$id]),
        ])

        if (memberships.rows.length === 0 || memberships.rows[0].role === 'viewer') {
            throw new Error('Permission denied')
        }

        const debt = await db.debts.create({
            ...data,
            createdBy: currentUser.$id,
            dueDate: data.dueDate ? data.dueDate : null,
            description: data.description ? data.description : null,
            notes: data.notes ? data.notes : null,
        })

        // Create associated transaction
        await db.transactions.create({
            createdBy: currentUser.$id,
            workspaceId: data.workspaceId,
            type: data.type === 'lent' ? 'expense' : 'income', // Lending is expense (outflow), Borrowing is income (inflow)
            categoryId: null,
            amount: data.amount,
            currency: data.currency,
            convertedAmount: null,
            exchangeRate: null,
            description: data.type === 'lent'
                ? `Lent to ${data.personName}`
                : `Borrowed from ${data.personName}`,
            transactionDate: new Date().toISOString(),
            recurringExpenseId: null,
            debtId: debt.$id,
            tags: ['debt'],
        })

        return { debt }
    })

// Update debt
export const updateDebtFn = createServerFn({ method: 'POST' })
    .inputValidator(updateDebtSchema)
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        // Fetch existing debt to check status and permissions
        const existingDebt = await db.debts.get(data.id)

        // Verify membership
        const memberships = await db.workspaceMembers.list([
            Query.equal('workspaceId', [existingDebt.workspaceId]),
            Query.equal('userId', [currentUser.$id]),
        ])

        if (memberships.rows.length === 0 || memberships.rows[0].role === 'viewer') {
            throw new Error('Permission denied')
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { ...data }
        delete updateData.id
        delete updateData.workspaceId

        const debt = await db.debts.update(data.id, updateData)

        // Check if debt was just marked as paid
        if (data.isPaid === true && !existingDebt.isPaid) {
            await db.transactions.create({
                createdBy: currentUser.$id,
                workspaceId: existingDebt.workspaceId,
                type: existingDebt.type === 'lent' ? 'income' : 'expense', // Repayment: Getting back lend (income) or paying back borrow (expense)
                categoryId: null,
                amount: existingDebt.amount,
                currency: existingDebt.currency,
                convertedAmount: null,
                exchangeRate: null,
                description: existingDebt.type === 'lent'
                    ? `Repayment from ${existingDebt.personName}`
                    : `Repayment to ${existingDebt.personName}`,
                transactionDate: new Date().toISOString(),
                recurringExpenseId: null,
                debtId: debt.$id,
                tags: ['debt', 'repayment'],
            })
        }

        return { debt }
    })

// Delete debt
export const deleteDebtFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ id: z.string(), workspaceId: z.string() }))
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        // Verify membership
        const memberships = await db.workspaceMembers.list([
            Query.equal('workspaceId', [data.workspaceId]),
            Query.equal('userId', [currentUser.$id]),
        ])

        if (memberships.rows.length === 0 || memberships.rows[0].role === 'viewer') {
            throw new Error('Permission denied')
        }

        await db.debts.delete(data.id)

        return { success: true }
    })
