import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { BudgetRadarChart } from '@/components/dashboard/budget-radar-chart'


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
import { Plus, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import type {
  BudgetCategories,
  Transactions,
} from '@/server/lib/appwrite.types'
import { cn } from '@/lib/utils'

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


  return (
    <div
      className={cn(
        "min-h-full animate-enter pb-32", // Base styles + animation + mobile padding
      )}
    >

      {/* Mobile Feed Layout (Visible on small screens) */}
      <div className="md:hidden space-y-4">
        <div className="relative overflow-hidden rounded-3xl bg-black text-white p-6 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Building2 className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1 py-4">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest">Total Balance</p>
            <h2 className="text-4xl font-bold tracking-tighter">
              {formatCurrency(summary?.netBalance || 0, currency)}
            </h2>
            <div className="flex items-center gap-2 mt-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-medium text-emerald-100">Live</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col justify-center items-center shadow-sm">
            <div className="bg-teal-500/10 p-2 rounded-full mb-2">
              <ArrowUpRight className="h-5 w-5 text-teal-500" />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Income</p>
            <p className="text-lg font-bold">{formatCurrency(summary?.totalIncome || 0, currency)}</p>
          </div>
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col justify-center items-center shadow-sm">
            <div className="bg-red-500/10 p-2 rounded-full mb-2">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase">Expense</p>
            <p className="text-lg font-bold">{formatCurrency(summary?.totalExpenses || 0, currency)}</p>
          </div>
        </div>
      </div>

      {/* Desktop Bento Grid (Hidden on Mobile) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

        {/* Net Balance */}
        <div className="col-span-2 card-sleek p-5 md:p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 duration-500">
            <Building2 className="w-40 h-40" />
          </div>
          <div className="space-y-2 relative z-10">
            <p className="label-data text-primary/80">Total Balance</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-glow">
              {formatCurrency(summary?.netBalance || 0, currency)}
            </h2>
          </div>
          <div className="mt-6 md:mt-8 flex items-center gap-3 text-sm text-muted-foreground relative z-10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-medium">Live Sync Active</span>
          </div>
        </div>

        {/* Total Income */}
        <div className="col-span-1 card-sleek p-4 md:p-6 flex flex-col justify-center space-y-2 md:space-y-4">
          <div className="flex items-center justify-between">
            <p className="label-data text-[10px] md:text-xs">Total Income</p>
            <div className="p-2 md:p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
              <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
          <p className="text-xl md:text-3xl font-semibold tracking-tight">
            {formatCurrency(summary?.totalIncome || 0, currency)}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="col-span-1 card-sleek p-4 md:p-6 flex flex-col justify-center space-y-2 md:space-y-4">
          <div className="flex items-center justify-between">
            <p className="label-data text-[10px] md:text-xs">Total Expenses</p>
            <div className="p-2 md:p-2.5 rounded-xl bg-red-500/10 text-red-500">
              <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
          <p className="text-xl md:text-3xl font-semibold tracking-tight">
            {formatCurrency(summary?.totalExpenses || 0, currency)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-0">
        {/* Secondary Charts / Insights */}
        <div className="lg:col-span-1 card-sleek p-6 hidden md:block">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg tracking-tight">Budget Overview</h3>
          </div>
          <BudgetRadarChart
            items={budgetOverview?.overview || []}
          />
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 card-sleek overflow-hidden flex flex-col rounded-2xl md:rounded-xl bg-transparent md:bg-white/60 dark:md:bg-white/5 border-0 md:border">
          <div className="p-4 md:p-6 border-b-0 md:border-b border-border flex items-center justify-between bg-transparent md:bg-card">
            <h3 className="font-semibold text-lg tracking-tight ml-2 md:ml-0">{t('dashboard_recent_transactions')}</h3>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-full bg-white/50 backdrop-blur-sm">View All</Button>
          </div>
          <div className="overflow-visible md:overflow-y-auto max-h-none md:max-h-[400px] p-0">
            <RecentTransactions
              transactions={recentTransactions}
              categories={categories}
              currency={currency}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Placeholder / Extra Widget Area */}
      <div className="w-full border border-dashed border-border rounded-lg p-8 flex flex-col justify-center items-center text-center space-y-3 hover:bg-muted/30 transition-all group cursor-pointer">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div>
          <p className="font-medium text-sm">Create custom module</p>
          <p className="text-xs text-muted-foreground">Add widgets to customize your view</p>
        </div>
      </div>


    </div>
  )
}
