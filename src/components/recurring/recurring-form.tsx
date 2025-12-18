import { useState, useEffect } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  createRecurringTransactionFn,
  updateRecurringTransactionFn,
} from '@/server/functions/recurring'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { Loader2, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  RecurringTransactions,
  BudgetCategories,
} from '@/server/lib/appwrite.types'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  categoryId: z.string().nullable().optional(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'UZS']),
  frequency: z.enum([
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'annual',
    'one_time',
  ]),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  isActive: z.boolean(),
  notes: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface RecurringFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTransaction?: RecurringTransactions | null
  categories: BudgetCategories[]
  onSuccess?: () => void
}

export function RecurringForm({
  open,
  onOpenChange,
  editingTransaction,
  categories,
  onSuccess,
}: RecurringFormProps) {
  const [loading, setLoading] = useState(false)
  const { workspace, currency } = useWorkspace()
  const { t } = useI18n()

  const createRecurring = useServerFn(createRecurringTransactionFn)
  const updateRecurring = useServerFn(updateRecurringTransactionFn)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: null,
      type: 'expense',
      amount: 0,
      currency: currency,
      frequency: 'monthly',
      startDate: new Date(),
      endDate: null,
      isActive: true,
      notes: '',
    },
  })

  useEffect(() => {
    if (editingTransaction) {
      form.reset({
        name: editingTransaction.name,
        categoryId: editingTransaction.categoryId || null,
        type: editingTransaction.type as FormValues['type'],
        amount: editingTransaction.amount,
        currency: editingTransaction.currency as FormValues['currency'],
        frequency: editingTransaction.frequency as FormValues['frequency'],
        startDate: new Date(editingTransaction.startDate),
        endDate: editingTransaction.endDate
          ? new Date(editingTransaction.endDate)
          : null,
        isActive: editingTransaction.isActive,
        notes: editingTransaction.notes || '',
      })
    } else {
      form.reset({
        name: '',
        categoryId: null,
        type: 'expense',
        amount: 0,
        currency: currency,
        frequency: 'monthly',
        startDate: new Date(),
        endDate: null,
        isActive: true,
        notes: '',
      })
    }
  }, [editingTransaction, currency, form])

  async function onSubmit(values: FormValues) {
    if (!workspace) return

    setLoading(true)
    try {
      if (editingTransaction) {
        await updateRecurring({
          data: {
            id: editingTransaction.$id,
            name: values.name,
            categoryId: values.categoryId || null,
            type: values.type,
            amount: values.amount,
            currency: values.currency,
            frequency: values.frequency,
            startDate: values.startDate.toISOString(),
            endDate: values.endDate?.toISOString() || null,
            isActive: values.isActive,
            notes: values.notes || null,
          },
        })
        toast.success(t('recurring_updated'))
      } else {
        await createRecurring({
          data: {
            workspaceId: workspace.$id,
            name: values.name,
            categoryId: values.categoryId || null,
            type: values.type,
            amount: values.amount,
            currency: values.currency,
            frequency: values.frequency,
            startDate: values.startDate.toISOString(),
            endDate: values.endDate?.toISOString() || null,
            isActive: values.isActive,
            notes: values.notes || null,
          },
        })
        toast.success(t('recurring_created'))
      }

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const frequencies = [
    { value: 'weekly', label: t('recurring_freq_weekly') },
    { value: 'biweekly', label: t('recurring_freq_biweekly') },
    { value: 'monthly', label: t('recurring_freq_monthly') },
    { value: 'quarterly', label: t('recurring_freq_quarterly') },
    { value: 'annual', label: t('recurring_freq_annual') },
    { value: 'one_time', label: t('recurring_freq_one_time') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? t('recurring_edit') : t('recurring_add')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('recurring_name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Name..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transaction_category')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories
                        .filter((c) => c.type === form.watch('type'))
                        .map((cat) => (
                          <SelectItem key={cat.$id} value={cat.$id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('recurring_amount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('workspace_currency')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="UZS">so'm UZS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('recurring_frequency')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('recurring_start_date')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? format(field.value, 'PP')
                              : 'Pick date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('recurring_end_date')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? format(field.value, 'PP')
                              : 'Optional'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('income_notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('recurring_active')}</FormLabel>
                    <FormDescription>
                      Active expenses will be automatically tracked
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTransaction ? t('update') : t('create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
