import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Briefcase,
  Laptop,
  TrendingUp,
  Home,
  Building,
  HelpCircle,
} from 'lucide-react'
import {
  deleteIncomeSourceFn,
  toggleIncomeSourceFn,
} from '@/server/functions/income'
import { formatCurrency, toMonthlyAmount, type Currency } from '@/lib/currency'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import type { TranslationKey } from '@/lib/i18n'
import type { IncomeSources } from '@/server/lib/appwrite.types'

interface IncomeListProps {
  sources: IncomeSources[]
  onEdit: (source: IncomeSources) => void
  onUpdate: () => void
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  salary: Briefcase,
  freelance: Laptop,
  investment: TrendingUp,
  rental: Home,
  business: Building,
  other: HelpCircle,
}

export function IncomeList({ sources, onEdit, onUpdate }: IncomeListProps) {
  const [deletingSource, setDeletingSource] = useState<IncomeSources | null>(
    null,
  )
  const { canEdit, currency: workspaceCurrency } = useWorkspace()
  const { t } = useI18n()

  const deleteIncome = useServerFn(deleteIncomeSourceFn)
  const toggleIncome = useServerFn(toggleIncomeSourceFn)

  const handleDelete = async () => {
    if (!deletingSource) return

    try {
      await deleteIncome({ data: { id: deletingSource.$id } })
      toast.success(t('income_deleted'))
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setDeletingSource(null)
    }
  }

  const handleToggle = async (source: IncomeSources) => {
    try {
      await toggleIncome({ data: { id: source.$id } })
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    }
  }

  const getTypeLabel = (type: string) => {
    const key = `income_type_${type}` as TranslationKey
    return t(key)
  }

  const getFrequencyLabel = (frequency: string) => {
    const key = `income_freq_${frequency}` as TranslationKey
    return t(key)
  }

  // Calculate total monthly income
  const totalMonthly = sources
    .filter((s) => s.isActive)
    .reduce((sum, s) => {
      const monthly = toMonthlyAmount(s.amount, s.frequency)
      // Convert if different currency
      if (s.currency !== workspaceCurrency) {
        // Simple conversion - in production use actual rates
        const rate = s.currency === 'USD' ? 12500 : 1 / 12500
        return sum + monthly * rate
      }
      return sum + monthly
    }, 0)

  if (sources.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('income_no_sources')}</p>
            <p className="text-sm mt-1">{t('income_add_first')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Total Monthly Income Card */}
      <Card className="mb-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('income_total_monthly')}
              </p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalMonthly, workspaceCurrency)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Sources List */}
      <div className="space-y-3">
        {sources.map((source) => {
          const Icon = typeIcons[source.type] || HelpCircle
          const monthlyAmount = toMonthlyAmount(source.amount, source.frequency)

          return (
            <Card
              key={source.$id}
              className={!source.isActive ? 'opacity-60' : ''}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{source.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(source.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(
                            source.amount,
                            source.currency as Currency,
                          )}{' '}
                          / {getFrequencyLabel(source.frequency)}
                        </span>
                        {source.frequency !== 'monthly' &&
                          source.frequency !== 'one_time' && (
                            <span className="text-xs text-muted-foreground">
                              (~
                              {formatCurrency(
                                monthlyAmount,
                                source.currency as Currency,
                              )}
                              /mo)
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {canEdit && (
                      <Switch
                        checked={source.isActive}
                        onCheckedChange={() => handleToggle(source)}
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
                          <DropdownMenuItem onClick={() => onEdit(source)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingSource(source)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                {source.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pl-14">
                    {source.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog
        open={!!deletingSource}
        onOpenChange={() => setDeletingSource(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSource?.name}"? This
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
