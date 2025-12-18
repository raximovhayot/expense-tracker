import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, type Currency } from '@/lib/currency'
import { useI18n } from '@/hooks/use-i18n'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type {
  Transactions,
  BudgetCategories,
} from '@/server/lib/appwrite.types'

interface RecentTransactionsProps {
  transactions: Transactions[]
  categories: BudgetCategories[]
  currency: Currency
}

export function RecentTransactions({
  transactions,
  categories,
  currency,
}: RecentTransactionsProps) {
  const { t } = useI18n()

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized'
    const category = categories.find((c) => c.$id === categoryId)
    return category?.name || 'Unknown'
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard_recent_transactions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('transaction_no_transactions')}</p>
            <p className="text-sm mt-1">{t('transaction_add_first')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard_recent_transactions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.$id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    transaction.type === 'income'
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
                  <p className="font-medium text-sm">
                    {transaction.description ||
                      getCategoryName(transaction.categoryId)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(transaction.transactionDate),
                        'MMM d, yyyy',
                      )}
                    </span>
                    {transaction.type === 'expense' &&
                      transaction.categoryId && (
                        <Badge variant="outline" className="text-xs py-0">
                          {getCategoryName(transaction.categoryId)}
                        </Badge>
                      )}
                  </div>
                </div>
              </div>
              <span
                className={`font-semibold ${
                  transaction.type === 'income'
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount, currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
