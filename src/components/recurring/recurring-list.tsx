import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { MoreHorizontal, Edit, Trash2, RefreshCw, Clock } from 'lucide-react'
import {
  deleteRecurringExpenseFn,
  toggleRecurringExpenseFn,
} from '@/server/functions/recurring'
import { formatCurrency, type Currency } from '@/lib/currency'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import type { TranslationKey } from '@/lib/i18n'
import type {
  RecurringExpenses,
  BudgetCategories,
} from '@/server/lib/appwrite.types'

interface RecurringListProps {
  expenses: RecurringExpenses[]
  categories: BudgetCategories[]
  onEdit: (expense: RecurringExpenses) => void
  onUpdate: () => void
}

export function RecurringList({
  expenses,
  categories,
  onEdit,
  onUpdate,
}: RecurringListProps) {
  const [deletingExpense, setDeletingExpense] =
    useState<RecurringExpenses | null>(null)
  const { canEdit } = useWorkspace()
  const { t } = useI18n()

  const deleteRecurring = useServerFn(deleteRecurringExpenseFn)
  const toggleRecurring = useServerFn(toggleRecurringExpenseFn)

  const handleDelete = async () => {
    if (!deletingExpense) return

    try {
      await deleteRecurring({ data: { id: deletingExpense.$id } })
      toast.success(t('recurring_deleted'))
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setDeletingExpense(null)
    }
  }

  const handleToggle = async (expense: RecurringExpenses) => {
    try {
      await toggleRecurring({ data: { id: expense.$id } })
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.$id === categoryId)
    return category?.name || 'Unknown'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.$id === categoryId)
    return category?.color || '#8E9196'
  }

  const getFrequencyLabel = (frequency: string) => {
    const key = `recurring_freq_${frequency}` as TranslationKey
    return t(key)
  }

  const getDaysUntilDue = (nextDueDate: string) => {
    const due = new Date(nextDueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('recurring_no_expenses')}</p>
            <p className="text-sm mt-1">{t('recurring_add_first')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {expenses.map((expense) => {
          const daysUntilDue = getDaysUntilDue(expense.nextDueDate)
          const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0
          const isOverdue = daysUntilDue < 0

          return (
            <Card
              key={expense.$id}
              className={!expense.isActive ? 'opacity-60' : ''}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{expense.name}</h3>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: getCategoryColor(expense.categoryId),
                            color: getCategoryColor(expense.categoryId),
                          }}
                        >
                          {getCategoryName(expense.categoryId)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-semibold text-red-500">
                          {formatCurrency(
                            expense.amount,
                            expense.currency as Currency,
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getFrequencyLabel(expense.frequency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Next Due Date */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        <span
                          className={
                            isOverdue
                              ? 'text-red-500 font-medium'
                              : isDueSoon
                                ? 'text-amber-500 font-medium'
                                : 'text-muted-foreground'
                          }
                        >
                          {isOverdue
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : daysUntilDue === 0
                              ? 'Due today'
                              : daysUntilDue === 1
                                ? 'Due tomorrow'
                                : `Due in ${daysUntilDue} days`}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(expense.nextDueDate), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {canEdit && (
                      <Switch
                        checked={expense.isActive}
                        onCheckedChange={() => handleToggle(expense)}
                      />
                    )}

                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(expense)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingExpense(expense)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                {expense.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pl-14">
                    {expense.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog
        open={!!deletingExpense}
        onOpenChange={() => setDeletingExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingExpense?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
