import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useI18n } from '@/hooks/use-i18n'
import type { Debts } from '@/server/lib/appwrite.types'
import { useServerFn } from '@tanstack/react-start'
import { createDebtFn, updateDebtFn } from '@/server/functions/debts'
import { useWorkspace } from '@/hooks/use-workspace'
import { toast } from 'sonner'
import { useEffect } from 'react'

const debtSchema = z.object({
    type: z.enum(['lent', 'borrowed']),
    personName: z.string().min(1),
    amount: z.number().min(0.01),
    currency: z.string().length(3),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    isPaid: z.boolean().default(false),
    notes: z.string().optional(),
})

type DebtFormValues = z.infer<typeof debtSchema>

interface DebtDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingDebt: Debts | null
    onSuccess: () => void
}

export function DebtDialog({
    open,
    onOpenChange,
    editingDebt,
    onSuccess,
}: DebtDialogProps) {
    const { t } = useI18n()
    const { workspace } = useWorkspace()
    const createDebt = useServerFn(createDebtFn)
    const updateDebt = useServerFn(updateDebtFn)

    const defaultValues: DebtFormValues = {
        type: 'lent',
        personName: '',
        amount: 0,
        currency: 'USD',
        description: '',
        dueDate: '',
        isPaid: false,
        notes: '',
    }

    const form = useForm<DebtFormValues>({
        resolver: zodResolver(debtSchema) as any,
        defaultValues,
    })

    useEffect(() => {
        if (editingDebt) {
            form.reset({
                type: editingDebt.type as 'lent' | 'borrowed',
                personName: editingDebt.personName,
                amount: editingDebt.amount,
                currency: editingDebt.currency,
                description: editingDebt.description || '',
                dueDate: editingDebt.dueDate ? editingDebt.dueDate.split('T')[0] : '',
                isPaid: editingDebt.isPaid,
                notes: editingDebt.notes || '',
            })
        } else {
            form.reset({
                type: 'lent',
                personName: '',
                amount: 0,
                currency: 'USD',
                description: '',
                dueDate: '',
                isPaid: false,
                notes: '',
            })
        }
    }, [editingDebt, form, open])

    const onSubmit = async (values: DebtFormValues) => {
        if (!workspace) return

        try {
            if (editingDebt) {
                await updateDebt({
                    data: {
                        id: editingDebt.$id,
                        workspaceId: editingDebt.workspaceId,
                        ...values,
                        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
                    },
                })
                toast.success(t('debts_updated'))
            } else {
                await createDebt({
                    data: {
                        workspaceId: workspace.$id,
                        ...values,
                        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
                    },
                })
                toast.success(t('debts_created'))
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to save debt:', error)
            toast.error(t('error_generic'))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingDebt ? t('debts_edit') : t('debts_add')}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('debts_type')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="lent">{t('debts_type_lent')}</SelectItem>
                                                <SelectItem value="borrowed">
                                                    {t('debts_type_borrowed')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('debts_currency')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="UZS">UZS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="personName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('debts_person')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('debts_amount')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('debts_description')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('debts_due_date')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isPaid"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>{t('debts_is_paid')}</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('debts_notes')}</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button type="submit">{t('save')}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
