import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { authMiddleware } from './auth'
import { Query } from 'node-appwrite'

// Schemas
const updatePreferencesSchema = z.object({
  defaultWorkspaceId: z.string().nullable().optional(),
  defaultLanguage: z.enum(['en', 'uz']).nullable().optional(),
  defaultCurrency: z.enum(['USD', 'UZS']).nullable().optional(),
  theme: z.enum(['light', 'dark', 'system']).nullable().optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
})

// Get user preferences
export const getPreferencesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const prefs = await db.userPreferences.list([
      Query.equal('createdBy', [currentUser.$id]),
    ])

    if (prefs.rows.length === 0) {
      // Create default preferences
      const defaultPrefs = await db.userPreferences.create({
        createdBy: currentUser.$id,
        defaultWorkspaceId: null,
        defaultLanguage: 'en',
        defaultCurrency: 'USD',
        theme: 'system',
        notificationsEnabled: true,
        emailNotifications: true,
      })
      return { preferences: defaultPrefs }
    }

    return { preferences: prefs.rows[0] }
  },
)

// Update user preferences
export const updatePreferencesFn = createServerFn({ method: 'POST' })
  .inputValidator(updatePreferencesSchema)
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const prefs = await db.userPreferences.list([
      Query.equal('createdBy', [currentUser.$id]),
    ])

    const updateData: Record<string, unknown> = {}
    if (data.defaultWorkspaceId !== undefined)
      updateData.defaultWorkspaceId = data.defaultWorkspaceId
    if (data.defaultLanguage !== undefined)
      updateData.defaultLanguage = data.defaultLanguage
    if (data.defaultCurrency !== undefined)
      updateData.defaultCurrency = data.defaultCurrency
    if (data.theme !== undefined) updateData.theme = data.theme
    if (data.notificationsEnabled !== undefined)
      updateData.notificationsEnabled = data.notificationsEnabled
    if (data.emailNotifications !== undefined)
      updateData.emailNotifications = data.emailNotifications

    let preferences
    if (prefs.rows.length === 0) {
      preferences = await db.userPreferences.create({
        createdBy: currentUser.$id,
        defaultWorkspaceId: data.defaultWorkspaceId ?? null,
        defaultLanguage: data.defaultLanguage ?? 'en',
        defaultCurrency: data.defaultCurrency ?? 'USD',
        theme: data.theme ?? 'system',
        notificationsEnabled: data.notificationsEnabled ?? true,
        emailNotifications: data.emailNotifications ?? true,
      })
    } else {
      preferences = await db.userPreferences.update(
        prefs.rows[0].$id,
        updateData,
      )
    }

    return { preferences }
  })

// Set default workspace
export const setDefaultWorkspaceFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ workspaceId: z.string().nullable() }))
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    // Verify workspace access if setting a workspace
    if (data.workspaceId) {
      const memberships = await db.workspaceMembers.list([
        Query.equal('workspaceId', [data.workspaceId]),
        Query.equal('userId', [currentUser.$id]),
      ])

      if (memberships.rows.length === 0) {
        throw new Error('Access denied to this workspace')
      }
    }

    const prefs = await db.userPreferences.list([
      Query.equal('createdBy', [currentUser.$id]),
    ])

    let preferences
    if (prefs.rows.length === 0) {
      preferences = await db.userPreferences.create({
        createdBy: currentUser.$id,
        defaultWorkspaceId: data.workspaceId,
        defaultLanguage: 'en',
        defaultCurrency: 'USD',
        theme: 'system',
        notificationsEnabled: true,
        emailNotifications: true,
      })
    } else {
      preferences = await db.userPreferences.update(prefs.rows[0].$id, {
        defaultWorkspaceId: data.workspaceId,
      })
    }

    return { preferences }
  })

// Get exchange rate
export const getExchangeRateFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      from: z.enum(['USD', 'UZS']),
      to: z.enum(['USD', 'UZS']),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    if (data.from === data.to) {
      return { rate: 1, fetchedAt: new Date().toISOString() }
    }

    // Check for cached rate (less than 1 hour old)
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const cachedRates = await db.exchangeRates.list([
      Query.equal('fromCurrency', [data.from]),
      Query.equal('toCurrency', [data.to]),
      Query.greaterThan('fetchedAt', oneHourAgo.toISOString()),
      Query.orderDesc('fetchedAt'),
      Query.limit(1),
    ])

    if (cachedRates.rows.length > 0) {
      return {
        rate: cachedRates.rows[0].rate,
        fetchedAt: cachedRates.rows[0].fetchedAt,
      }
    }

    // Default rate if no cached rate found
    // In production, you would fetch from an API
    const defaultRate = data.from === 'USD' ? 12500 : 1 / 12500

    // Cache the rate
    await db.exchangeRates.create({
      createdBy: currentUser.$id,
      fromCurrency: data.from,
      toCurrency: data.to,
      rate: defaultRate,
      fetchedAt: new Date().toISOString(),
    })

    return { rate: defaultRate, fetchedAt: new Date().toISOString() }
  })

// Update exchange rate (admin function)
export const updateExchangeRateFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      from: z.enum(['USD', 'UZS']),
      to: z.enum(['USD', 'UZS']),
      rate: z.number().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await authMiddleware()
    if (!currentUser) throw new Error('Unauthorized')

    const exchangeRate = await db.exchangeRates.create({
      createdBy: currentUser.$id,
      fromCurrency: data.from,
      toCurrency: data.to,
      rate: data.rate,
      fetchedAt: new Date().toISOString(),
    })

    // Also create the inverse rate
    await db.exchangeRates.create({
      createdBy: currentUser.$id,
      fromCurrency: data.to,
      toCurrency: data.from,
      rate: 1 / data.rate,
      fetchedAt: new Date().toISOString(),
    })

    return { exchangeRate }
  })
