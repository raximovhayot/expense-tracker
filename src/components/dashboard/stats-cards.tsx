import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, type Currency } from '@/lib/currency'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  budgetUsedPercent: number
  currency: Currency
}

export function StatsCards({
  totalIncome,
  totalExpenses,
  netBalance,
  budgetUsedPercent,
  currency,
}: StatsCardsProps) {
  const { t } = useI18n()

  const stats = [
    {
      title: t('dashboard_total_income'),
      value: formatCurrency(totalIncome, currency),
      icon: TrendingUp,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: t('dashboard_total_expenses'),
      value: formatCurrency(totalExpenses, currency),
      icon: TrendingDown,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: t('dashboard_net_balance'),
      value: formatCurrency(netBalance, currency),
      icon: Wallet,
      iconColor: netBalance >= 0 ? 'text-blue-500' : 'text-orange-500',
      bgColor: netBalance >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10',
    },
    {
      title: t('dashboard_budget_status'),
      value: `${budgetUsedPercent}%`,
      subtitle:
        budgetUsedPercent > 100
          ? t('budget_over_budget')
          : t('budget_on_track'),
      icon: PiggyBank,
      iconColor:
        budgetUsedPercent > 100
          ? 'text-red-500'
          : budgetUsedPercent > 80
            ? 'text-amber-500'
            : 'text-primary',
      bgColor:
        budgetUsedPercent > 100
          ? 'bg-red-500/10'
          : budgetUsedPercent > 80
            ? 'bg-amber-500/10'
            : 'bg-primary/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={cn('p-2 rounded-lg', stat.bgColor)}>
              <stat.icon className={cn('h-4 w-4', stat.iconColor)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.subtitle && (
              <p className={cn('text-xs mt-1', stat.iconColor)}>
                {stat.subtitle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
