import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db, Query } from '../lib/db'
import { authMiddleware } from './auth'

// Schemas
const createIncomeSourceSchema = z.object({
    workspaceId: z.string(),
    name: z.string().min(1).max(100),
    type: z.enum([
        'salary',
        'freelance',
        'investment',
        'rental',
        'business',
        'other',
    ]),
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
    isActive: z.boolean(),
    notes: z.string().max(500).optional().nullable(),
})

const updateIncomeSourceSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(100).optional(),
    type: z.enum([
        'salary',
        'freelance',
        'investment',
        'rental',
        'business',
        'other',
    ]).optional(),
    amount: z.number().positive().optional(),
    currency: z.enum(['USD', 'UZS']).optional(),
    frequency: z.enum([
        'weekly',
        'biweekly',
        'monthly',
        'quarterly',
        'annual',
        'one_time',
    ]).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().max(500).optional().nullable(),
})

// Create income source
export const createIncomeSourceFn = createServerFn({ method: 'POST' })
    .inputValidator(createIncomeSourceSchema)
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        // Verify workspace access
        const membership = await db.workspaceMembers.list([
            Query.equal('workspaceId', [data.workspaceId]),
            Query.equal('userId', [currentUser.$id]),
        ])

        if (membership.rows.length === 0 || membership.rows[0].role === 'viewer') {
            throw new Error('Permission denied')
        }

        const incomeSource = await db.incomeSources.create({
            ...data,
            createdBy: currentUser.$id,
            notes: data.notes || null,
            description: null, // Legacy field
            color: null, // Legacy field
            icon: null, // Legacy field
        })

        return { incomeSource }
    })

// Update income source
export const updateIncomeSourceFn = createServerFn({ method: 'POST' })
    .inputValidator(updateIncomeSourceSchema)
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        const existing = await db.incomeSources.get(data.id)

        // Verify workspace access
        const membership = await db.workspaceMembers.list([
            Query.equal('workspaceId', [existing.workspaceId]),
            Query.equal('userId', [currentUser.$id]),
        ])

        if (membership.rows.length === 0 || membership.rows[0].role === 'viewer') {
            throw new Error('Permission denied')
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { ...data }
        delete updateData.id

        const incomeSource = await db.incomeSources.update(data.id, updateData)

        return { incomeSource }
    })

// Delete income source
export const deleteIncomeSourceFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ id: z.string() }))
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        const existing = await db.incomeSources.get(data.id)

        // Verify workspace access
        const membership = await db.workspaceMembers.list([
            Query.equal('workspaceId', [existing.workspaceId]),
            Query.equal('userId', [currentUser.$id]),
        ])

        if (membership.rows.length === 0 || membership.rows[0].role === 'viewer') {
            throw new Error('Permission denied')
        }

        await db.incomeSources.delete(data.id)

        return { success: true }
    })

// Toggle active status
export const toggleIncomeSourceFn = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ id: z.string() }))
    .handler(async ({ data }) => {
        const { currentUser } = await authMiddleware()
        if (!currentUser) throw new Error('Unauthorized')

        const existing = await db.incomeSources.get(data.id)

        // Verify workspace access
        const membership = await db.workspaceMembers.list([
            Query.equal('workspaceId', [existing.workspaceId]),
            Query.equal('userId', [currentUser.$id]),
        ])

        if (membership.rows.length === 0 || membership.rows[0].role === 'viewer') {
            throw new Error('Permission denied')
        }

        const incomeSource = await db.incomeSources.update(data.id, {
            isActive: !existing.isActive,
        })

        return { incomeSource }
    })
