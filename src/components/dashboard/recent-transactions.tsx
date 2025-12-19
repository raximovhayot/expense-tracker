import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, type Currency } from '@/lib/currency'
import { useI18n } from '@/hooks/use-i18n'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  Transactions,
  BudgetCategories,
} from '@/server/lib/appwrite.types'

interface RecentTransactionsProps {
  transactions: Transactions[]
  categories: BudgetCategories[]
  currency: Currency
  compact?: boolean
}

export function RecentTransactions({
  transactions,
  categories,
  currency,
  compact = false,
}: RecentTransactionsProps) {
  const { t } = useI18n()

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized'
    const category = categories.find((c) => c.$id === categoryId)
    return category?.name || 'Unknown'
  }

  const content = (
    <div className={cn("space-y-1", compact ? "" : "p-4")}>
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground opacity-60">
          <p className="text-sm">{t('transaction_no_transactions')}</p>
        </div>
      ) : (
        transactions.map((transaction) => (
          <div
            key={transaction.$id}
            className={cn(
              "flex items-center justify-between p-3 rounded-2xl transition-colors hover:bg-muted/30 group",
              compact ? "mb-1 last:mb-0" : "border-b border-border last:border-0"
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  transaction.type === 'income'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {transaction.type === 'income' ? (
                  <ArrowUpRight className="h-6 w-6" />
                ) : (
                  <ArrowDownRight className="h-6 w-6" />
                )}
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-sm tracking-tight">
                  {transaction.description || getCategoryName(transaction.categoryId)}
                </p>
                <div className="flex items-center gap-2">
                  <p className="label-tiny">
                    {format(new Date(transaction.transactionDate), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-lg font-black tracking-tight",
                transaction.type === 'income' ? 'text-primary' : 'text-destructive'
              )}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount, currency)}
              </p>
              {transaction.categoryId && !compact && (
                <p className="label-tiny mt-0.5">{getCategoryName(transaction.categoryId)}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )

  if (compact) {
    return content
  }

  return (
    <Card className="card-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold tracking-tight">{t('dashboard_recent_transactions')}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
