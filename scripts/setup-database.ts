/**
 * Appwrite Database Setup Script
 * 
 * Creates all required database collections for the expense tracker app.
 * 
 * Usage:
 *   pnpm run setup:db
 * 
 * Note: Make sure your .env.local file has:
 *   - APPWRITE_ENDPOINT
 *   - APPWRITE_PROJECT_ID
 *   - APPWRITE_API_KEY
 */

import { Client, Databases, IndexType, Permission, Role } from 'node-appwrite'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

// Configuration
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID
const API_KEY = process.env.APPWRITE_API_KEY
const DATABASE_ID = process.env.APPWRITE_DB_ID || 'expense_tracker'

if (!PROJECT_ID || !API_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   APPWRITE_PROJECT_ID:', PROJECT_ID ? '✓' : '✗')
    console.error('   APPWRITE_API_KEY:', API_KEY ? '✓' : '✗')
    process.exit(1)
}

// Initialize client
const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY)

const databases = new Databases(client)

// =============================================================================
// COLLECTION SCHEMAS
// =============================================================================

interface Attr {
    key: string
    type: 'string' | 'integer' | 'float' | 'boolean' | 'datetime' | 'email'
    size?: number
    required: boolean
    array?: boolean
}

interface Collection {
    id: string
    name: string
    attrs: Attr[]
    indexes?: { key: string; type: 'key' | 'unique'; attrs: string[] }[]
}

const COLLECTIONS: Collection[] = [
    {
        id: 'workspaces',
        name: 'Workspaces',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 1000, required: false },
            { key: 'currency', type: 'string', size: 10, required: true },
            { key: 'language', type: 'string', size: 10, required: true },
            { key: 'memberCount', type: 'integer', required: false },
        ],
        indexes: [{ key: 'idx_createdBy', type: 'key', attrs: ['createdBy'] }],
    },
    {
        id: 'workspace_members',
        name: 'Workspace Members',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'workspaceId', type: 'string', size: 36, required: true },
            { key: 'userId', type: 'string', size: 36, required: true },
            { key: 'userEmail', type: 'email', required: true },
            { key: 'role', type: 'string', size: 50, required: true },
        ],
        indexes: [
            { key: 'idx_workspaceId', type: 'key', attrs: ['workspaceId'] },
            { key: 'idx_userId', type: 'key', attrs: ['userId'] },
            { key: 'idx_unique_member', type: 'unique', attrs: ['workspaceId', 'userId'] },
        ],
    },
    {
        id: 'workspace_invitations',
        name: 'Workspace Invitations',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'workspaceId', type: 'string', size: 36, required: true },
            { key: 'email', type: 'email', required: true },
            { key: 'role', type: 'string', size: 50, required: true },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'invitedBy', type: 'string', size: 36, required: true },
            { key: 'expiresAt', type: 'datetime', required: false },
        ],
        indexes: [
            { key: 'idx_workspaceId', type: 'key', attrs: ['workspaceId'] },
            { key: 'idx_email', type: 'key', attrs: ['email'] },
        ],
    },
    {
        id: 'income_sources',
        name: 'Income Sources',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'workspaceId', type: 'string', size: 36, required: true },
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'type', type: 'string', size: 50, required: true },
            { key: 'amount', type: 'float', required: true },
            { key: 'currency', type: 'string', size: 10, required: true },
            { key: 'frequency', type: 'string', size: 50, required: true },
            { key: 'isActive', type: 'boolean', required: false },
            { key: 'notes', type: 'string', size: 1000, required: false },
        ],
        indexes: [{ key: 'idx_workspaceId', type: 'key', attrs: ['workspaceId'] }],
    },
    {
        id: 'budget_categories',
        name: 'Budget Categories',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'workspaceId', type: 'string', size: 36, required: true },
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'icon', type: 'string', size: 100, required: false },
            { key: 'color', type: 'string', size: 20, required: false },
            { key: 'isDefault', type: 'boolean', required: false },
        ],
        indexes: [{ key: 'idx_workspaceId', type: 'key', attrs: ['workspaceId'] }],
    },
    {
        id: 'monthly_budgets',
        name: 'Monthly Budgets',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'workspaceId', type: 'string', size: 36, required: true },
            { key: 'categoryId', type: 'string', size: 36, required: true },
            { key: 'year', type: 'integer', required: true },
            { key: 'month', type: 'integer', required: true },
            { key: 'plannedAmount', type: 'float', required: true },
            { key: 'currency', type: 'string', size: 10, required: true },
        ],
        indexes: [
            { key: 'idx_workspaceId', type: 'key', attrs: ['workspaceId'] },
            { key: 'idx_categoryId', type: 'key', attrs: ['categoryId'] },
        ],
    },
    {
        id: 'transactions',
        name: 'Transactions',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'workspaceId', type: 'string', size: 36, required: true },
            { key: 'type', type: 'string', size: 50, required: true },
            { key: 'categoryId', type: 'string', size: 36, required: false },
            { key: 'incomeSourceId', type: 'string', size: 36, required: false },
            { key: 'amount', type: 'float', required: true },
            { key: 'currency', type: 'string', size: 10, required: true },
            { key: 'convertedAmount', type: 'float', required: false },
            { key: 'exchangeRate', type: 'float', required: false },
            { key: 'description', type: 'string', size: 1000, required: false },
            { key: 'transactionDate', type: 'datetime', required: true },
            { key: 'recurringExpenseId', type: 'string', size: 36, required: false },
            { key: 'tags', type: 'string', size: 50, required: false, array: true },
        ],
        indexes: [
            { key: 'idx_workspaceId', type: 'key', attrs: ['workspaceId'] },
            { key: 'idx_transactionDate', type: 'key', attrs: ['transactionDate'] },
        ],
    },
    {
        id: 'recurring_expenses',
        name: 'Recurring Expenses',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'workspaceId', type: 'string', size: 36, required: true },
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'categoryId', type: 'string', size: 36, required: true },
            { key: 'amount', type: 'float', required: true },
            { key: 'currency', type: 'string', size: 10, required: true },
            { key: 'frequency', type: 'string', size: 50, required: true },
            { key: 'startDate', type: 'datetime', required: true },
            { key: 'endDate', type: 'datetime', required: false },
            { key: 'nextDueDate', type: 'datetime', required: true },
            { key: 'lastProcessedDate', type: 'datetime', required: false },
            { key: 'isActive', type: 'boolean', required: false },
            { key: 'notes', type: 'string', size: 1000, required: false },
        ],
        indexes: [
            { key: 'idx_workspaceId', type: 'key', attrs: ['workspaceId'] },
            { key: 'idx_nextDueDate', type: 'key', attrs: ['nextDueDate'] },
        ],
    },
    {
        id: 'user_preferences',
        name: 'User Preferences',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'defaultWorkspaceId', type: 'string', size: 36, required: false },
            { key: 'defaultLanguage', type: 'string', size: 10, required: false },
            { key: 'defaultCurrency', type: 'string', size: 10, required: false },
            { key: 'theme', type: 'string', size: 20, required: false },
            { key: 'notificationsEnabled', type: 'boolean', required: false },
            { key: 'emailNotifications', type: 'boolean', required: false },
        ],
        indexes: [{ key: 'idx_createdBy', type: 'unique', attrs: ['createdBy'] }],
    },
    {
        id: 'exchange_rates',
        name: 'Exchange Rates',
        attrs: [
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'fromCurrency', type: 'string', size: 10, required: true },
            { key: 'toCurrency', type: 'string', size: 10, required: true },
            { key: 'rate', type: 'float', required: true },
            { key: 'fetchedAt', type: 'datetime', required: true },
        ],
        indexes: [{ key: 'idx_currencies', type: 'unique', attrs: ['fromCurrency', 'toCurrency'] }],
    },
]

// =============================================================================
// SETUP FUNCTIONS
// =============================================================================

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function createDatabase() {
    console.log(`\n📦 Database: ${DATABASE_ID}`)
    try {
        await databases.get(DATABASE_ID)
        console.log('   ✓ Already exists')
    } catch {
        await databases.create(DATABASE_ID, 'Expense Tracker')
        console.log('   ✓ Created')
    }
}

async function createAttr(collId: string, attr: Attr) {
    try {
        switch (attr.type) {
            case 'string':
                await databases.createStringAttribute(
                    DATABASE_ID, collId, attr.key, attr.size || 255, attr.required, undefined, attr.array
                )
                break
            case 'integer':
                await databases.createIntegerAttribute(
                    DATABASE_ID, collId, attr.key, attr.required, undefined, undefined, undefined, attr.array
                )
                break
            case 'float':
                await databases.createFloatAttribute(
                    DATABASE_ID, collId, attr.key, attr.required, undefined, undefined, undefined, attr.array
                )
                break
            case 'boolean':
                await databases.createBooleanAttribute(
                    DATABASE_ID, collId, attr.key, attr.required, undefined, attr.array
                )
                break
            case 'datetime':
                await databases.createDatetimeAttribute(
                    DATABASE_ID, collId, attr.key, attr.required, undefined, attr.array
                )
                break
            case 'email':
                await databases.createEmailAttribute(
                    DATABASE_ID, collId, attr.key, attr.required, undefined, attr.array
                )
                break
        }
        console.log(`   ✓ ${attr.key}`)
    } catch (e: unknown) {
        const err = e as { code?: number }
        if (err.code === 409) {
            console.log(`   - ${attr.key} (exists)`)
        } else {
            throw e
        }
    }
}

async function createCollection(coll: Collection) {
    console.log(`\n📁 ${coll.name} (${coll.id})`)

    // Check if exists
    try {
        await databases.getCollection(DATABASE_ID, coll.id)
        console.log('   ✓ Already exists')
        return
    } catch {
        // Continue to create
    }

    // Create collection
    await databases.createCollection(
        DATABASE_ID,
        coll.id,
        coll.name,
        [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ],
        true
    )
    console.log('   ✓ Created')

    // Create attributes
    for (const attr of coll.attrs) {
        await createAttr(coll.id, attr)
    }

    // Wait for attributes
    console.log('   ⏳ Waiting for attributes...')
    await sleep(3000)

    // Create indexes
    if (coll.indexes) {
        for (const idx of coll.indexes) {
            try {
                await databases.createIndex(
                    DATABASE_ID, coll.id, idx.key, idx.type as IndexType, idx.attrs
                )
                console.log(`   ✓ Index: ${idx.key}`)
            } catch (e: unknown) {
                const err = e as { code?: number; message?: string }
                if (err.code === 409) {
                    console.log(`   - Index: ${idx.key} (exists)`)
                } else {
                    console.log(`   ⚠ Index: ${idx.key} - ${err.message}`)
                }
            }
        }
    }
}

async function main() {
    console.log('🚀 Appwrite Database Setup')
    console.log('='.repeat(40))
    console.log(`Endpoint: ${ENDPOINT}`)
    console.log(`Project:  ${PROJECT_ID}`)

    try {
        await createDatabase()

        for (const coll of COLLECTIONS) {
            await createCollection(coll)
        }

        console.log('\n' + '='.repeat(40))
        console.log('✅ Setup complete!')
        console.log('\n📝 Add to .env.local:')
        console.log(`   APPWRITE_DB_ID=${DATABASE_ID}`)

    } catch (err) {
        console.error('\n❌ Failed:', err)
        process.exit(1)
    }
}

main()
