import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/page-container'
import { TransactionList } from '@/components/transactions/transaction-list'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { listTransactionsFn } from '@/server/functions/transactions'
import { listCategoriesFn } from '@/server/functions/budgets'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import type {
  Transactions,
  BudgetCategories,
} from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/transactions')({
  component: TransactionsPage,
})

function TransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transactions[]>([])
  const [categories, setCategories] = useState<BudgetCategories[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transactions | null>(null)

  const { workspace, canEdit } = useWorkspace()
  const { t } = useI18n()

  const fetchTransactions = useServerFn(listTransactionsFn)
  const fetchCategories = useServerFn(listCategoriesFn)

  const loadData = async () => {
    if (!workspace) return

    setLoading(true)
    try {
      const [transactionsResult, categoriesResult] =
        await Promise.all([
          fetchTransactions({
            data: { workspaceId: workspace.$id, limit: 100 },
          }),
          fetchCategories({ data: { workspaceId: workspace.$id } }),
        ])

      setTransactions(transactionsResult.transactions)
      setCategories(categoriesResult.categories)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [workspace])

  const handleEdit = (transaction: Transactions) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleCloseForm = (open: boolean) => {
    setShowForm(open)
    if (!open) {
      setEditingTransaction(null)
    }
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a workspace to view transactions
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <PageContainer fullWidth={false} className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('transaction_title')}</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your transactions
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('transaction_add')}
          </Button>
        )}
      </div>

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        categories={categories}
        onEdit={handleEdit}
        onUpdate={loadData}
      />

      {/* Form Dialog */}
      <TransactionForm
        open={showForm}
        onOpenChange={handleCloseForm}
        editingTransaction={editingTransaction}
        categories={categories}
        onSuccess={loadData}
      />
    </PageContainer>
  )
}
