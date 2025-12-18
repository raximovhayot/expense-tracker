import {
  Client,
  TablesDB,
  ID,
  type Models,
  Permission,
  Role,
} from 'node-appwrite'
import type {
  Workspaces,
  WorkspaceMembers,
  WorkspaceInvitations,
  IncomeSources,
  BudgetCategories,
  MonthlyBudgets,
  Transactions,
  RecurringExpenses,
  UserPreferences,
  ExchangeRates,
} from './appwrite.types'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const tablesDB = new TablesDB(client)

export const db = {
  workspaces: {
    create: (
      data: Omit<Workspaces, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Workspaces>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspaces',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Workspaces>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspaces',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Workspaces, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Workspaces>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspaces',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspaces',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Workspaces>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspaces',
        queries,
      }),
  },
  workspaceMembers: {
    create: (
      data: Omit<WorkspaceMembers, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<WorkspaceMembers>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_members',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<WorkspaceMembers>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_members',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<WorkspaceMembers, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<WorkspaceMembers>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_members',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_members',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<WorkspaceMembers>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_members',
        queries,
      }),
  },
  workspaceInvitations: {
    create: (
      data: Omit<WorkspaceInvitations, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<WorkspaceInvitations>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_invitations',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<WorkspaceInvitations>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_invitations',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<WorkspaceInvitations, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<WorkspaceInvitations>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_invitations',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_invitations',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<WorkspaceInvitations>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'workspace_invitations',
        queries,
      }),
  },
  incomeSources: {
    create: (
      data: Omit<IncomeSources, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<IncomeSources>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'income_sources',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<IncomeSources>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'income_sources',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<IncomeSources, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<IncomeSources>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'income_sources',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'income_sources',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<IncomeSources>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'income_sources',
        queries,
      }),
  },
  budgetCategories: {
    create: (
      data: Omit<BudgetCategories, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<BudgetCategories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'budget_categories',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<BudgetCategories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'budget_categories',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<BudgetCategories, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<BudgetCategories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'budget_categories',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'budget_categories',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<BudgetCategories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'budget_categories',
        queries,
      }),
  },
  monthlyBudgets: {
    create: (
      data: Omit<MonthlyBudgets, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<MonthlyBudgets>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'monthly_budgets',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<MonthlyBudgets>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'monthly_budgets',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<MonthlyBudgets, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<MonthlyBudgets>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'monthly_budgets',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'monthly_budgets',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<MonthlyBudgets>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'monthly_budgets',
        queries,
      }),
  },
  transactions: {
    create: (
      data: Omit<Transactions, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Transactions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'transactions',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Transactions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'transactions',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Transactions, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Transactions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'transactions',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'transactions',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Transactions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'transactions',
        queries,
      }),
  },
  recurringExpenses: {
    create: (
      data: Omit<RecurringExpenses, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<RecurringExpenses>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'recurring_expenses',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<RecurringExpenses>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'recurring_expenses',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<RecurringExpenses, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<RecurringExpenses>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'recurring_expenses',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'recurring_expenses',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<RecurringExpenses>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'recurring_expenses',
        queries,
      }),
  },
  userPreferences: {
    create: (
      data: Omit<UserPreferences, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<UserPreferences>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_preferences',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<UserPreferences>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_preferences',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<UserPreferences, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<UserPreferences>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_preferences',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_preferences',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<UserPreferences>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_preferences',
        queries,
      }),
  },
  exchangeRates: {
    create: (
      data: Omit<ExchangeRates, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<ExchangeRates>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'exchange_rates',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<ExchangeRates>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'exchange_rates',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<ExchangeRates, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<ExchangeRates>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'exchange_rates',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'exchange_rates',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<ExchangeRates>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'exchange_rates',
        queries,
      }),
  },
}
