import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { RecurringList } from '@/components/recurring/recurring-list'
import { RecurringForm } from '@/components/recurring/recurring-form'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import {
  listRecurringTransactionsFn,
  processDueTransactionsFn,
} from '@/server/functions/recurring'
import { listCategoriesFn } from '@/server/functions/budgets'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Play } from 'lucide-react'
import type {
  RecurringTransactions,
  BudgetCategories,
} from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/recurring')({
  component: RecurringPage,
})

function RecurringPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<RecurringTransactions[]>([])
  const [categories, setCategories] = useState<BudgetCategories[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<RecurringTransactions | null>(null)
  const [processing, setProcessing] = useState(false)

  const { workspace, canEdit } = useWorkspace()
  const { t } = useI18n()

  const fetchTransactions = useServerFn(listRecurringTransactionsFn)
  const fetchCategories = useServerFn(listCategoriesFn)
  const processDue = useServerFn(processDueTransactionsFn)

  const loadData = async () => {
    if (!workspace) return

    setLoading(true)
    try {
      const [transactionsResult, categoriesResult] = await Promise.all([
        fetchTransactions({ data: { workspaceId: workspace.$id } }),
        fetchCategories({ data: { workspaceId: workspace.$id } }),
      ])

      setTransactions(transactionsResult.recurring)
      setCategories(categoriesResult.categories)
    } catch (error) {
      console.error('Failed to load recurring expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [workspace])

  const handleEdit = (transaction: RecurringTransactions) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleCloseForm = (open: boolean) => {
    setShowForm(open)
    if (!open) {
      setEditingTransaction(null)
    }
  }

  const handleProcessDue = async () => {
    if (!workspace) return

    setProcessing(true)
    try {
      const result = await processDue({ data: { workspaceId: workspace.$id } })
      if (result.count > 0) {
        toast.success(`Processed ${result.count} due expense(s)`)
        loadData()
      } else {
        toast.info('No due expenses to process')
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a workspace to manage recurring expenses
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('recurring_title')}</h1>
          <p className="text-muted-foreground mt-1">
            Automate tracking of monthly, quarterly, and annual expenses
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleProcessDue}
              disabled={processing}
            >
              <Play className="h-4 w-4 mr-2" />
              Process Due
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('recurring_add')}
            </Button>
          </div>
        )}
      </div>

      {/* Recurring List */}
      <RecurringList
        transactions={transactions}
        categories={categories}
        onEdit={handleEdit}
        onUpdate={loadData}
      />

      {/* Form Dialog */}
      <RecurringForm
        open={showForm}
        onOpenChange={handleCloseForm}
        editingTransaction={editingTransaction}
        categories={categories}
        onSuccess={loadData}
      />
    </div>
  )
}
