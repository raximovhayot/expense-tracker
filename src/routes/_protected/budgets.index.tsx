import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { BudgetPlanner } from '@/components/budgets/budget-planner'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/page-container'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import {
  listCategoriesFn,
  listMonthlyBudgetsFn,
  getBudgetOverviewFn,

} from '@/server/functions/budgets'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type {
  BudgetCategories,
  MonthlyBudgets,
  BudgetItems,
} from '@/server/lib/appwrite.types'

interface BudgetOverviewItem {
  category: BudgetCategories
  planned: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

export const Route = createFileRoute('/_protected/budgets/')({
  component: BudgetsPage,
})

function BudgetsPage() {
  const navigate = Route.useNavigate()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<BudgetCategories[]>([])
  const [budgets, setBudgets] = useState<MonthlyBudgets[]>([])
  const [overview, setOverview] = useState<BudgetOverviewItem[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const { workspace, canEdit } = useWorkspace()
  const { t } = useI18n()

  const fetchCategories = useServerFn(listCategoriesFn)
  const fetchBudgets = useServerFn(listMonthlyBudgetsFn)
  const fetchOverview = useServerFn(getBudgetOverviewFn)

  const loadData = async () => {
    if (!workspace) return

    setLoading(true)
    try {
      const [categoriesResult, budgetsResult, overviewResult] =
        await Promise.all([
          fetchCategories({ data: { workspaceId: workspace.$id } }),
          fetchBudgets({ data: { workspaceId: workspace.$id, year, month } }),
          fetchOverview({ data: { workspaceId: workspace.$id, year, month } }),
        ])

      setCategories(categoriesResult.categories)
      setBudgets(budgetsResult.budgets)
      setOverview(overviewResult.overview)
    } catch (error) {
      console.error('Failed to load budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [workspace, year, month])

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear)
    setMonth(newMonth)
  }



  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a workspace to manage budgets
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('budget_title')}</h1>
          <p className="text-muted-foreground mt-1">
            Plan your monthly budgets and track spending by category
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {/* Category management moved to settings */}
          </div>
        )}
      </div>

      <BudgetPlanner
        categories={categories}
        budgets={budgets}
        overview={overview}
        year={year}
        month={month}
        onMonthChange={handleMonthChange}
        onUpdate={loadData}
        onCategoryClick={(category) => {
          navigate({ to: '/budgets/$categoryId', params: { categoryId: category.$id } })
        }}
      />
    </PageContainer>
  )
}




