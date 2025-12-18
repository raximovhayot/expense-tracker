import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
})

const updateWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
})

const inviteMemberSchema = z.object({
  workspaceId: z.string(),
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']),
})

const updateInvitationSchema = z.object({
  invitationId: z.string(),
  status: z.enum(['accepted', 'rejected']),
})

const updateMemberRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(['editor', 'viewer']),
})

// List workspaces for current user
export const listWorkspacesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    console.log('[Workspaces] listWorkspacesFn for:', currentUser?.email || 'ANONYMOUS')
    if (!currentUser) throw new Error('Unauthorized')

    // Get workspaces where user is a member
    const memberships = await db.workspaceMembers.list([
      Query.equal('userId', [currentUser.$id]),
    ])

    if (memberships.rows.length === 0) {
      return { workspaces: [] }
    }

    const workspaceIds = memberships.rows.map((m) => m.workspaceId)
    const workspaces = await db.workspaces.list([
      Query.equal('$id', workspaceIds),
    ])

    // Attach role to each workspace
    const workspacesWithRole = workspaces.rows.map((ws) => {
      const membership = memberships.rows.find((m) => m.workspaceId === ws.$id)
      return {
        ...ws,
        userRole: membership?.role || 'viewer',
      }
    })

    return { workspaces: workspacesWithRole }
  },
)

// Get single workspace
export const getWorkspaceFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify membership
    const memberships = await db.workspaceMembers.list([
      Query.equal('workspaceId', [data.id]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (memberships.rows.length === 0) {
      throw new Error('Access denied')
    }

    const workspace = await db.workspaces.get(data.id)
    return {
      workspace: {
        ...workspace,
        userRole: memberships.rows[0].role,
      },
    }
  })

// Create workspace
export const createWorkspaceFn = createServerFn({ method: 'POST' })
  .inputValidator(createWorkspaceSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Create workspace
    const workspace = await db.workspaces.create({
      createdBy: currentUser.$id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      currency: 'USD', // Required by Appwrite schema
      language: 'en',  // Required by Appwrite schema
    })


    // Add creator as owner member
    await db.workspaceMembers.create({
      createdBy: currentUser.$id,
      workspaceId: workspace.$id,
      userId: currentUser.$id,
      userEmail: currentUser.email,
      role: 'owner',
    })

    // Create default budget categories
    const defaultCategories = [
      { name: 'Housing', icon: 'home', color: '#9B87F5' },
      { name: 'Food & Dining', icon: 'utensils', color: '#22C55E' },
      { name: 'Transportation', icon: 'car', color: '#0EA5E9' },
      { name: 'Utilities', icon: 'zap', color: '#F59E0B' },
      { name: 'Healthcare', icon: 'heart', color: '#EF4444' },
      { name: 'Entertainment', icon: 'film', color: '#D946EF' },
      { name: 'Shopping', icon: 'shopping-bag', color: '#F97316' },
      { name: 'Education', icon: 'book', color: '#6366F1' },
      { name: 'Personal Care', icon: 'user', color: '#EC4899' },
      { name: 'Other', icon: 'more-horizontal', color: '#8E9196' },
    ]

    for (const cat of defaultCategories) {
      await db.budgetCategories.create({
        createdBy: currentUser.$id,
        workspaceId: workspace.$id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
      })
    }

    return { workspace }
  })

// Update workspace
export const updateWorkspaceFn = createServerFn({ method: 'POST' })
  .inputValidator(updateWorkspaceSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const memberships = await db.workspaceMembers.list([
      Query.equal('workspaceId', [data.id]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (memberships.rows.length === 0 || memberships.rows[0].role !== 'owner') {
      throw new Error('Only owners can update workspace settings')
    }

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name.trim()
    if (data.description !== undefined)
      updateData.description = data.description?.trim() || null

    const workspace = await db.workspaces.update(data.id, updateData)
    return { workspace }
  })

// Delete workspace
export const deleteWorkspaceFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership
    const memberships = await db.workspaceMembers.list([
      Query.equal('workspaceId', [data.id]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (memberships.rows.length === 0 || memberships.rows[0].role !== 'owner') {
      throw new Error('Only owners can delete workspaces')
    }

    // Delete all related data
    const [
      members,
      invitations,
      income,
      categories,
      budgets,
      transactions,
      recurring,
    ] = await Promise.all([
      db.workspaceMembers.list([Query.equal('workspaceId', [data.id])]),
      db.workspaceInvitations.list([Query.equal('workspaceId', [data.id])]),
      db.incomeSources.list([Query.equal('workspaceId', [data.id])]),
      db.budgetCategories.list([Query.equal('workspaceId', [data.id])]),
      db.monthlyBudgets.list([Query.equal('workspaceId', [data.id])]),
      db.transactions.list([Query.equal('workspaceId', [data.id])]),
      db.recurringExpenses.list([Query.equal('workspaceId', [data.id])]),
    ])

    // Delete all in parallel
    await Promise.all([
      ...members.rows.map((m) => db.workspaceMembers.delete(m.$id)),
      ...invitations.rows.map((i) => db.workspaceInvitations.delete(i.$id)),
      ...income.rows.map((i) => db.incomeSources.delete(i.$id)),
      ...categories.rows.map((c) => db.budgetCategories.delete(c.$id)),
      ...budgets.rows.map((b) => db.monthlyBudgets.delete(b.$id)),
      ...transactions.rows.map((t) => db.transactions.delete(t.$id)),
      ...recurring.rows.map((r) => db.recurringExpenses.delete(r.$id)),
    ])

    await db.workspaces.delete(data.id)
    return { success: true }
  })

// Invite member
export const inviteMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(inviteMemberSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify ownership or editor role
    const memberships = await db.workspaceMembers.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (
      memberships.rows.length === 0 ||
      memberships.rows[0].role === 'viewer'
    ) {
      throw new Error('You do not have permission to invite members')
    }

    // Check if already a member
    const existingMembers = await db.workspaceMembers.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('userEmail', [data.email.toLowerCase()]),
    ])

    if (existingMembers.rows.length > 0) {
      throw new Error('User is already a member of this workspace')
    }

    // Check for existing pending invitation
    const existingInvitations = await db.workspaceInvitations.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('email', [data.email.toLowerCase()]),
      Query.equal('status', ['pending']),
    ])

    if (existingInvitations.rows.length > 0) {
      throw new Error('An invitation is already pending for this email')
    }

    // Create invitation
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invitation = await db.workspaceInvitations.create({
      createdBy: currentUser.$id,
      workspaceId: data.workspaceId,
      email: data.email.toLowerCase(),
      role: data.role,
      status: 'pending',
      invitedBy: currentUser.$id,
      expiresAt: expiresAt.toISOString(),
    })

    return { invitation }
  })

// List workspace members
export const listMembersFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ workspaceId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify membership
    const userMembership = await db.workspaceMembers.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (userMembership.rows.length === 0) {
      throw new Error('Access denied')
    }

    const members = await db.workspaceMembers.list([
      Query.equal('workspaceId', [data.workspaceId]),
    ])

    return { members: members.rows }
  })

// List pending invitations
export const listInvitationsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ workspaceId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify membership
    const userMembership = await db.workspaceMembers.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (userMembership.rows.length === 0) {
      throw new Error('Access denied')
    }

    const invitations = await db.workspaceInvitations.list([
      Query.equal('workspaceId', [data.workspaceId]),
      Query.equal('status', ['pending']),
    ])

    return { invitations: invitations.rows }
  })

// Get user's pending invitations
export const getUserInvitationsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const invitations = await db.workspaceInvitations.list([
      Query.equal('email', [currentUser.email.toLowerCase()]),
      Query.equal('status', ['pending']),
    ])

    // Get workspace names
    const workspaceIds = invitations.rows.map((i) => i.workspaceId)
    if (workspaceIds.length === 0) {
      return { invitations: [] }
    }

    const workspaces = await db.workspaces.list([
      Query.equal('$id', workspaceIds),
    ])

    const invitationsWithWorkspace = invitations.rows.map((inv) => ({
      ...inv,
      workspaceName:
        workspaces.rows.find((w) => w.$id === inv.workspaceId)?.name ||
        'Unknown',
    }))

    return { invitations: invitationsWithWorkspace }
  },
)

// Accept or reject invitation
export const respondToInvitationFn = createServerFn({ method: 'POST' })
  .inputValidator(updateInvitationSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const invitation = await db.workspaceInvitations.get(data.invitationId)

    if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new Error('This invitation is not for you')
    }

    if (invitation.status !== 'pending') {
      throw new Error('This invitation has already been processed')
    }

    if (data.status === 'accepted') {
      // Add user as member
      await db.workspaceMembers.create({
        createdBy: currentUser.$id,
        workspaceId: invitation.workspaceId,
        userId: currentUser.$id,
        userEmail: currentUser.email,
        role: invitation.role,
      })

      // Member count logic removed
    }

    // Update invitation status
    await db.workspaceInvitations.update(data.invitationId, {
      status: data.status,
    })

    return { success: true }
  })

// Remove member
export const removeMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ memberId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const member = await db.workspaceMembers.get(data.memberId)

    // Verify ownership
    const userMembership = await db.workspaceMembers.list([
      Query.equal('workspaceId', [member.workspaceId]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (
      userMembership.rows.length === 0 ||
      userMembership.rows[0].role !== 'owner'
    ) {
      throw new Error('Only owners can remove members')
    }

    if (member.role === 'owner') {
      throw new Error('Cannot remove the owner')
    }

    await db.workspaceMembers.delete(data.memberId)

    // Member count logic removed

    return { success: true }
  })

// Update member role
export const updateMemberRoleFn = createServerFn({ method: 'POST' })
  .inputValidator(updateMemberRoleSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const member = await db.workspaceMembers.get(data.memberId)

    // Verify ownership
    const userMembership = await db.workspaceMembers.list([
      Query.equal('workspaceId', [member.workspaceId]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (
      userMembership.rows.length === 0 ||
      userMembership.rows[0].role !== 'owner'
    ) {
      throw new Error('Only owners can change member roles')
    }

    if (member.role === 'owner') {
      throw new Error('Cannot change owner role')
    }

    await db.workspaceMembers.update(data.memberId, {
      role: data.role,
    })

    return { success: true }
  })

// Cancel invitation
export const cancelInvitationFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ invitationId: z.string() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const invitation = await db.workspaceInvitations.get(data.invitationId)

    // Verify ownership or editor role
    const userMembership = await db.workspaceMembers.list([
      Query.equal('workspaceId', [invitation.workspaceId]),
      Query.equal('userId', [currentUser.$id]),
    ])

    if (
      userMembership.rows.length === 0 ||
      userMembership.rows[0].role === 'viewer'
    ) {
      throw new Error('You do not have permission to cancel invitations')
    }

    await db.workspaceInvitations.delete(data.invitationId)
    return { success: true }
  })
