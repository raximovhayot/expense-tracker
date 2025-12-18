import { useState, useEffect } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  createIncomeSourceFn,
  updateIncomeSourceFn,
} from '@/server/functions/income'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { Loader2 } from 'lucide-react'
import type { IncomeSources } from '@/server/lib/appwrite.types'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum([
    'salary',
    'freelance',
    'investment',
    'rental',
    'business',
    'other',
  ]),
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
  isActive: z.boolean(),
  notes: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface IncomeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSource?: IncomeSources | null
  onSuccess?: () => void
}

export function IncomeForm({
  open,
  onOpenChange,
  editingSource,
  onSuccess,
}: IncomeFormProps) {
  const [loading, setLoading] = useState(false)
  const { workspace, currency } = useWorkspace()
  const { t } = useI18n()

  const createIncome = useServerFn(createIncomeSourceFn)
  const updateIncome = useServerFn(updateIncomeSourceFn)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'salary',
      amount: 0,
      currency: currency,
      frequency: 'monthly',
      isActive: true,
      notes: '',
    },
  })

  useEffect(() => {
    if (editingSource) {
      form.reset({
        name: editingSource.name,
        type: editingSource.type as FormValues['type'],
        amount: editingSource.amount,
        currency: editingSource.currency as FormValues['currency'],
        frequency: editingSource.frequency as FormValues['frequency'],
        isActive: editingSource.isActive,
        notes: editingSource.notes || '',
      })
    } else {
      form.reset({
        name: '',
        type: 'salary',
        amount: 0,
        currency: currency,
        frequency: 'monthly',
        isActive: true,
        notes: '',
      })
    }
  }, [editingSource, currency, form])

  async function onSubmit(values: FormValues) {
    if (!workspace) return

    setLoading(true)
    try {
      if (editingSource) {
        await updateIncome({
          data: {
            id: editingSource.$id,
            ...values,
            notes: values.notes || null,
          },
        })
        toast.success(t('income_updated'))
      } else {
        await createIncome({
          data: {
            workspaceId: workspace.$id,
            ...values,
            notes: values.notes || null,
          },
        })
        toast.success(t('income_created'))
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

  const incomeTypes = [
    { value: 'salary', label: t('income_type_salary') },
    { value: 'freelance', label: t('income_type_freelance') },
    { value: 'investment', label: t('income_type_investment') },
    { value: 'rental', label: t('income_type_rental') },
    { value: 'business', label: t('income_type_business') },
    { value: 'other', label: t('income_type_other') },
  ]

  const frequencies = [
    { value: 'weekly', label: t('income_freq_weekly') },
    { value: 'biweekly', label: t('income_freq_biweekly') },
    { value: 'monthly', label: t('income_freq_monthly') },
    { value: 'quarterly', label: t('income_freq_quarterly') },
    { value: 'annual', label: t('income_freq_annual') },
    { value: 'one_time', label: t('income_freq_one_time') },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingSource ? t('income_edit') : t('income_add')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('income_name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Job, Side Project..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('income_type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {incomeTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('income_frequency')}</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('income_amount')}</FormLabel>
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
                    <FormLabel>{t('income_active')}</FormLabel>
                    <FormDescription>
                      Active income sources are included in calculations
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
                {editingSource ? t('update') : t('create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
