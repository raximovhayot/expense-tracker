import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { BudgetOverview } from '@/components/dashboard/budget-overview'
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import {
  getTransactionSummaryFn,
  getRecentTransactionsFn,
} from '@/server/functions/transactions'
import {
  getBudgetOverviewFn,
  listCategoriesFn,
} from '@/server/functions/budgets'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2 } from 'lucide-react'
import type {
  BudgetCategories,
  Transactions,
} from '@/server/lib/appwrite.types'

interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
}

interface BudgetOverviewData {
  overview: Array<{
    category: {
      $id: string
      name: string
      icon: string | null
      color: string | null
    }
    planned: number
    spent: number
    remaining: number
    percentage: number
    isOverBudget: boolean
  }>
  summary?: {
    overallPercentage: number
  }
}

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [budgetOverview, setBudgetOverview] =
    useState<BudgetOverviewData | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transactions[]>(
    [],
  )
  const [categories, setCategories] = useState<BudgetCategories[]>([])

  const { workspace, currency } = useWorkspace()
  const { t } = useI18n()

  const fetchSummary = useServerFn(getTransactionSummaryFn)
  const fetchBudgetOverview = useServerFn(getBudgetOverviewFn)
  const fetchRecentTransactions = useServerFn(getRecentTransactionsFn)
  const fetchCategories = useServerFn(listCategoriesFn)

  useEffect(() => {
    async function loadData() {
      if (!workspace) return

      setLoading(true)
      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        const [
          summaryResult,
          budgetResult,
          transactionsResult,
          categoriesResult,
        ] = await Promise.all([
          fetchSummary({ data: { workspaceId: workspace.$id, year, month } }),
          fetchBudgetOverview({
            data: { workspaceId: workspace.$id, year, month },
          }),
          fetchRecentTransactions({
            data: { workspaceId: workspace.$id, limit: 5 },
          }),
          fetchCategories({ data: { workspaceId: workspace.$id } }),
        ])

        setSummary(summaryResult)
        setBudgetOverview(budgetResult)
        setRecentTransactions(transactionsResult.transactions)
        setCategories(categoriesResult.categories)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [workspace])

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a workspace to view dashboard
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  const budgetUsedPercent = budgetOverview?.summary?.overallPercentage || 0

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard_title')}</h1>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{workspace.name}</span>
            <span>•</span>
            {/* <span>
              {t('workspace_member_count', { count: (workspace as any).memberCount || 1 })}
            </span> */}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalIncome={summary?.totalIncome || 0}
        totalExpenses={summary?.totalExpenses || 0}
        netBalance={summary?.netBalance || 0}
        budgetUsedPercent={budgetUsedPercent}
        currency={currency}
      />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart
          income={summary?.totalIncome || 0}
          expenses={summary?.totalExpenses || 0}
          currency={currency}
        />
        <BudgetOverview
          items={budgetOverview?.overview || []}
          currency={currency}
        />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions
        transactions={recentTransactions}
        categories={categories}
        currency={currency}
      />
    </div>
  )
}
