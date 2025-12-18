import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Save,
  Home,
  Utensils,
  Car,
  Zap,
  Heart,
  Film,
  ShoppingBag,
  Book,
  User,
  MoreHorizontal,
} from 'lucide-react'
import {
  setBudgetFn,
  copyBudgetsFromPreviousMonthFn,
} from '@/server/functions/budgets'
import { formatCurrency } from '@/lib/currency'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'
import type {
  BudgetCategories,
  MonthlyBudgets,
} from '@/server/lib/appwrite.types'

interface BudgetItem {
  category: BudgetCategories
  planned: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

interface BudgetPlannerProps {
  categories: BudgetCategories[]
  budgets: MonthlyBudgets[]
  overview: BudgetItem[]
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
  onUpdate: () => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  zap: Zap,
  heart: Heart,
  film: Film,
  'shopping-bag': ShoppingBag,
  book: Book,
  user: User,
  'more-horizontal': MoreHorizontal,
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function BudgetPlanner({
  categories,
  budgets,
  overview,
  year,
  month,
  onMonthChange,
  onUpdate,
}: BudgetPlannerProps) {
  const [editingBudgets, setEditingBudgets] = useState<Record<string, number>>(
    {},
  )
  const [saving, setSaving] = useState(false)
  const { workspace, canEdit, currency } = useWorkspace()
  const { t } = useI18n()

  const setBudget = useServerFn(setBudgetFn)
  const copyBudgets = useServerFn(copyBudgetsFromPreviousMonthFn)

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12)
    } else {
      onMonthChange(year, month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1)
    } else {
      onMonthChange(year, month + 1)
    }
  }

  const handleBudgetChange = (categoryId: string, value: string) => {
    const amount = parseFloat(value) || 0
    setEditingBudgets((prev) => ({ ...prev, [categoryId]: amount }))
  }

  const handleSaveBudget = async (categoryId: string) => {
    if (!workspace) return

    const amount = editingBudgets[categoryId]
    if (amount === undefined) return

    setSaving(true)
    try {
      await setBudget({
        data: {
          workspaceId: workspace.$id,
          categoryId,
          year,
          month,
          plannedAmount: amount,
          currency: currency,
        },
      })
      toast.success(t('budget_updated'))
      setEditingBudgets((prev) => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyFromPrevious = async () => {
    if (!workspace) return

    try {
      const result = await copyBudgets({
        data: {
          workspaceId: workspace.$id,
          year,
          month,
        },
      })
      toast.success(`Copied ${result.count} budgets from previous month`)
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    }
  }

  const getBudgetForCategory = (categoryId: string) => {
    return budgets.find((b) => b.categoryId === categoryId)?.plannedAmount || 0
  }

  const getOverviewForCategory = (categoryId: string) => {
    return overview.find((o) => o.category.$id === categoryId)
  }

  const totalPlanned = overview.reduce((sum, o) => sum + o.planned, 0)
  const totalSpent = overview.reduce((sum, o) => sum + o.spent, 0)

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-bold">
                {monthNames[month - 1]} {year}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('budget_planned')}: {formatCurrency(totalPlanned, currency)}{' '}
                | {t('budget_spent')}: {formatCurrency(totalSpent, currency)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Copy from Previous Month */}
      {canEdit && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleCopyFromPrevious}>
            <Copy className="h-4 w-4 mr-2" />
            Copy from Previous Month
          </Button>
        </div>
      )}

      {/* Budget Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const Icon =
            iconMap[category.icon || 'more-horizontal'] || MoreHorizontal
          const currentBudget = getBudgetForCategory(category.$id)
          const overviewItem = getOverviewForCategory(category.$id)
          const editValue = editingBudgets[category.$id]
          const isEditing = editValue !== undefined

          return (
            <Card key={category.$id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <span style={{ color: category.color || undefined }}>
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      {overviewItem && overviewItem.planned > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(overviewItem.spent, currency)} /{' '}
                          {formatCurrency(overviewItem.planned, currency)}
                        </p>
                      )}
                    </div>
                  </div>
                  {overviewItem?.isOverBudget && (
                    <Badge variant="destructive" className="text-xs">
                      {t('budget_over_budget')}
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                {overviewItem && overviewItem.planned > 0 && (
                  <div className="mb-3">
                    <Progress
                      value={Math.min(overviewItem.percentage, 100)}
                      className={cn(
                        'h-2',
                        overviewItem.isOverBudget && '[&>div]:bg-red-500',
                      )}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {overviewItem.percentage}% used
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          overviewItem.isOverBudget
                            ? 'text-red-500'
                            : 'text-green-500',
                        )}
                      >
                        {overviewItem.isOverBudget ? 'Over by ' : 'Remaining: '}
                        {formatCurrency(
                          Math.abs(overviewItem.remaining),
                          currency,
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Budget Input */}
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t('budget_set_amount')}
                      value={isEditing ? editValue : currentBudget || ''}
                      onChange={(e) =>
                        handleBudgetChange(category.$id, e.target.value)
                      }
                      className="flex-1"
                    />
                    {isEditing && (
                      <Button
                        size="icon"
                        onClick={() => handleSaveBudget(category.$id)}
                        disabled={saving}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
