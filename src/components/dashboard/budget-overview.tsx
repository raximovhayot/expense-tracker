import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, type Currency } from '@/lib/currency'
import { useI18n } from '@/hooks/use-i18n'
import {
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

interface BudgetItem {
  category: {
    $id: string
    name: string
    icon: string | null
    color: string | null
  }
  planned: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

interface BudgetOverviewProps {
  items: BudgetItem[]
  currency: Currency
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

export function BudgetOverview({ items, currency }: BudgetOverviewProps) {
  const { t } = useI18n()

  // Filter to only show categories with budgets set
  const budgetedItems = items.filter((item) => item.planned > 0)

  if (budgetedItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard_budget_overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('budget_no_categories')}</p>
            <p className="text-sm mt-1">{t('budget_add_first_category')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard_budget_overview')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgetedItems.map((item) => {
          const IconComponent =
            iconMap[item.category.icon || 'more-horizontal'] || MoreHorizontal

          return (
            <div key={item.category.$id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${item.category.color}20` }}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">
                    {item.category.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(item.spent, currency)} /{' '}
                    {formatCurrency(item.planned, currency)}
                  </span>
                  {item.isOverBudget && (
                    <Badge variant="destructive" className="text-xs">
                      +{formatCurrency(Math.abs(item.remaining), currency)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="relative">
                <Progress
                  value={Math.min(item.percentage, 100)}
                  className="h-2"
                />
                {item.percentage > 100 && (
                  <div
                    className="absolute top-0 left-0 h-2 rounded-full bg-red-500"
                    style={{ width: '100%' }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
