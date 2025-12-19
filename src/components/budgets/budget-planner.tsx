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
  onCategoryClick: (category: BudgetCategories) => void
  onUpdate: () => void
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { CategoryIcon } from './category-icon'

export function BudgetPlanner({
  categories,
  budgets,
  overview,
  year,
  month,
  onMonthChange,
  onUpdate,
  onCategoryClick,
}: BudgetPlannerProps) {

  const [saving, setSaving] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [newBudgetCategory, setNewBudgetCategory] = useState<string>('')
  const [newBudgetAmount, setNewBudgetAmount] = useState('')

  const { workspace, canEdit, currency } = useWorkspace()
  const { t } = useI18n()

  const setBudget = useServerFn(setBudgetFn)
  const copyBudgets = useServerFn(copyBudgetsFromPreviousMonthFn)

  // Derived state
  const activeCategories = categories.filter(c => budgets.some(b => b.categoryId === c.$id && b.plannedAmount > 0))

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


  const handleAddBudget = async () => {
    if (!workspace || !newBudgetCategory || !newBudgetAmount) return

    setSaving(true)
    try {
      await setBudget({
        data: {
          workspaceId: workspace.$id,
          categoryId: newBudgetCategory,
          year,
          month,
          plannedAmount: parseFloat(newBudgetAmount),
          currency: currency,
        },
      })
      toast.success(t('budget_updated'))
      setShowAddBudget(false)
      setNewBudgetCategory('')
      setNewBudgetAmount('')
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

      {/* Actions */}
      {canEdit && (
        <div className="flex justify-end gap-2">
          <Button onClick={() => setShowAddBudget(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Set Budget
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyFromPrevious}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Previous
          </Button>
        </div>
      )}

      {/* Budget Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {activeCategories.map((category) => {

          const currentBudget = getBudgetForCategory(category.$id)
          const overviewItem = getOverviewForCategory(category.$id)


          return (
            <Card key={category.$id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => onCategoryClick(category)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <span style={{ color: category.color || undefined }}>
                        <CategoryIcon name={category.icon} className="h-5 w-5" />
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


              </CardContent>
            </Card>
          )
        })}

        {activeCategories.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            No budgets set for this month. Click "Set Budget" to get started.
          </div>
        )}
      </div>

      <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Budget Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={newBudgetCategory} onValueChange={setNewBudgetCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => {
                    const isActive = activeCategories.some(ac => ac.$id === cat.$id)
                    return (
                      <SelectItem key={cat.$id} value={cat.$id}>
                        {cat.name} {isActive ? '(Current)' : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Amount</label>
              <Input
                type="number"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                placeholder="Enter amount..."
              />
            </div>

            <Button className="w-full" onClick={handleAddBudget} disabled={!newBudgetCategory || !newBudgetAmount || saving}>
              {saving ? 'Saving...' : 'Set Budget'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
