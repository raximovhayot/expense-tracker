import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schemas
const createIncomeSchema = z.object({
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
  isActive: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional(),
})

const updateIncomeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  type: z
    .enum(['salary', 'freelance', 'investment', 'rental', 'business', 'other'])
    .optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(['USD', 'UZS']).optional(),
  frequency: z
    .enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual', 'one_time'])
    .optional(),
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

// List income sources for workspace
export const listIncomeSourcesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ workspaceId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id)

    const sources = await db.incomeSources.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.orderDesc('$createdAt'),
    ])

    return { sources: sources.rows }
  })

// Get single income source
export const getIncomeSourceFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const source = await db.incomeSources.get(data.id)
    await verifyWorkspaceAccess(source.workspaceId, currentUser.$id)

    return { source }
  })

// Create income source
export const createIncomeSourceFn = createServerFn({ method: 'POST' })
  .inputValidator(createIncomeSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    await verifyWorkspaceAccess(data.workspaceId, currentUser.$id, true)

    const source = await db.incomeSources.create({
      createdBy: currentUser.$id,
      workspaceId: data.workspaceId,
      name: data.name.trim(),
      type: data.type,
      amount: data.amount,
      currency: data.currency,
      frequency: data.frequency,
      isActive: data.isActive,
      notes: data.notes?.trim() || null,
    })

    return { source }
  })

// Update income source
export const updateIncomeSourceFn = createServerFn({ method: 'POST' })
  .inputValidator(updateIncomeSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.incomeSources.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name.trim()
    if (data.type) updateData.type = data.type
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.currency) updateData.currency = data.currency
    if (data.frequency) updateData.frequency = data.frequency
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null

    const source = await db.incomeSources.update(data.id, updateData)
    return { source }
  })

// Delete income source
export const deleteIncomeSourceFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.incomeSources.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    await db.incomeSources.delete(data.id)
    return { success: true }
  })

// Toggle income source active status
export const toggleIncomeSourceFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const existing = await db.incomeSources.get(data.id)
    await verifyWorkspaceAccess(existing.workspaceId, currentUser.$id, true)

    const source = await db.incomeSources.update(data.id, {
      isActive: !existing.isActive,
    })

    return { source }
  })
