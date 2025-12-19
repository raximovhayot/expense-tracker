import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatCurrency,
  formatCompactCurrency,
  type Currency,
} from '@/lib/currency'
import { useI18n } from '@/hooks/use-i18n'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface IncomeExpenseChartProps {
  income: number
  expenses: number
  currency: Currency
}

export function IncomeExpenseChart({
  income,
  expenses,
  currency,
}: IncomeExpenseChartProps) {
  const { t } = useI18n()

  const data = [
    {
      name: t('transaction_type_income'),
      value: income,
      fill: 'var(--color-chart-2)',
    },
    {
      name: t('transaction_type_expense'),
      value: expenses,
      fill: 'var(--color-destructive)',
    },
  ]

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ payload: { name: string }; value: number }>
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value, currency)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard_income_vs_expenses')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  formatCompactCurrency(value, currency)
                }
              />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary below chart */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t('transaction_type_income')}
            </p>
            <p className="text-lg font-semibold text-green-500">
              {formatCurrency(income, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t('transaction_type_expense')}
            </p>
            <p className="text-lg font-semibold text-red-500">
              {formatCurrency(expenses, currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t('dashboard_net_balance')}
            </p>
            <p
              className={`text-lg font-semibold ${income - expenses >= 0 ? 'text-blue-500' : 'text-orange-500'}`}
            >
              {formatCurrency(income - expenses, currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
