import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Receipt,
} from 'lucide-react'
import { deleteTransactionFn } from '@/server/functions/transactions'
import { formatCurrency, type Currency } from '@/lib/currency'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import type {
  Transactions,
  BudgetCategories,
} from '@/server/lib/appwrite.types'

interface TransactionListProps {
  transactions: Transactions[]
  categories: BudgetCategories[]
  onEdit: (transaction: Transactions) => void
  onUpdate: () => void
}

export function TransactionList({
  transactions,
  categories,
  onEdit,
  onUpdate,
}: TransactionListProps) {
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transactions | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { canEdit } = useWorkspace()
  const { t } = useI18n()

  const deleteTransaction = useServerFn(deleteTransactionFn)

  const handleDelete = async () => {
    if (!deletingTransaction) return

    try {
      await deleteTransaction({ data: { id: deletingTransaction.$id } })
      toast.success(t('transaction_deleted'))
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setDeletingTransaction(null)
    }
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized'
    const category = categories.find((c) => c.$id === categoryId)
    return category?.name || 'Unknown'
  }

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#8E9196'
    const category = categories.find((c) => c.$id === categoryId)
    return category?.color || '#8E9196'
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    if (categoryFilter !== 'all' && t.categoryId !== categoryFilter)
      return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const description = t.description?.toLowerCase() || ''
      const category = getCategoryName(t.categoryId).toLowerCase()
      if (!description.includes(query) && !category.includes(query))
        return false
    }
    return true
  })

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('transaction_no_transactions')}</p>
            <p className="text-sm mt-1">{t('transaction_add_first')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-none shadow-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px] bg-card border-none shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={t('transaction_filter_type')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="income">
              {t('transaction_type_income')}
            </SelectItem>
            <SelectItem value="expense">
              {t('transaction_type_expense')}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-card border-none shadow-sm">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={t('transaction_filter_category')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.$id} value={cat.$id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction.$id} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${transaction.type === 'income'
                        ? 'bg-green-500/10'
                        : 'bg-red-500/10'
                      }`}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-base">
                      {transaction.description ||
                        getCategoryName(transaction.categoryId)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        {format(
                          new Date(transaction.transactionDate),
                          'MMM d, yyyy',
                        )}
                      </span>
                      {transaction.type === 'expense' &&
                        transaction.categoryId && (
                          <Badge
                            variant="outline"
                            className="text-xs py-0"
                            style={{
                              borderColor: getCategoryColor(
                                transaction.categoryId,
                              ),
                              color: getCategoryColor(transaction.categoryId),
                            }}
                          >
                            {getCategoryName(transaction.categoryId)}
                          </Badge>
                        )}
                      {transaction.tags && transaction.tags.length > 0 && (
                        <Badge variant="secondary" className="text-xs py-0">
                          {transaction.tags[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold ${transaction.type === 'income'
                        ? 'text-green-500'
                        : 'text-red-500'
                      }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(
                      transaction.amount,
                      transaction.currency as Currency,
                    )}
                  </span>

                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingTransaction(transaction)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && transactions.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No transactions match your filters</p>
        </div>
      )}

      <AlertDialog
        open={!!deletingTransaction}
        onOpenChange={() => setDeletingTransaction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
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
