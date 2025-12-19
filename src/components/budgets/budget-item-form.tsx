import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
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
import { Switch } from '@/components/ui/switch'
import { useI18n } from '@/hooks/use-i18n'
import { useServerFn } from '@tanstack/react-start'
import { createBudgetItemFn, updateBudgetItemFn } from '@/server/functions/budget-items'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import type { BudgetItems, BudgetCategories } from '@/server/lib/appwrite.types'
import { useWorkspace } from '@/hooks/use-workspace'
import { Calculator } from 'lucide-react'

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    categoryId: z.string().optional(),
    quantityType: z.enum(['fixed', 'unit', 'weight']),
    quantity: z.union([z.string(), z.number()]).transform((val) => Number(val) || 0),
    unitPrice: z.union([z.string(), z.number()]).transform((val) => Number(val) || 0),
    isPurchased: z.boolean(),
})

interface BudgetItemFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    year: number
    month: number
    categories: BudgetCategories[]
    editingItem?: BudgetItems | null
    onSuccess: () => void
}

export function BudgetItemForm({
    open,
    onOpenChange,
    year,
    month,
    categories,
    editingItem,
    onSuccess,
}: BudgetItemFormProps) {
    const { t } = useI18n()
    const { workspace, currency } = useWorkspace()
    const createItem = useServerFn(createBudgetItemFn)
    const updateItem = useServerFn(updateBudgetItemFn)
    const [submitting, setSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: '',
            quantityType: 'fixed',
            quantity: 1,
            unitPrice: 0,
            isPurchased: false,
        },
    })

    useEffect(() => {
        if (editingItem) {
            form.reset({
                name: editingItem.name,
                categoryId: editingItem.categoryId || undefined,
                quantityType: editingItem.quantityType as 'fixed' | 'unit' | 'weight',
                quantity: editingItem.quantity,
                unitPrice: editingItem.unitPrice,
                isPurchased: editingItem.isPurchased || false,
            })
        } else {
            form.reset({
                name: '',
                quantityType: 'fixed',
                quantity: 1,
                unitPrice: 0,
                isPurchased: false,
            })
        }
    }, [editingItem, form, open])

    // Watch values to calculate total
    const quantityType = form.watch('quantityType')
    const quantity = Number(form.watch('quantity'))
    const unitPrice = Number(form.watch('unitPrice'))
    const estimatedTotal = quantity * unitPrice

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!workspace) return

        setSubmitting(true)
        try {
            const payload = {
                name: values.name,
                categoryId: values.categoryId,
                quantityType: values.quantityType,
                quantity: values.quantity,
                unitPrice: values.unitPrice,
                plannedAmount: values.quantity * values.unitPrice,
                isPurchased: values.isPurchased,
            }

            if (editingItem) {
                await updateItem({
                    data: {
                        id: editingItem.$id,
                        data: payload,
                    },
                })
                toast.success(t('budget_item_updated'))
            } else {
                await createItem({
                    data: {
                        ...payload,
                        workspaceId: workspace.$id,
                        year,
                        month,
                        currency: currency,
                    },
                })
                toast.success(t('budget_item_created'))
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error(t('error_generic'))
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingItem ? 'Edit Budget Item' : 'New Budget Item'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Groceries, Rent" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((cat) => (
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

                            <FormField
                                control={form.control}
                                name="quantityType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
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
                                                <SelectItem value="fixed">Fixed Price</SelectItem>
                                                <SelectItem value="unit">Per Unit (Count)</SelectItem>
                                                <SelectItem value="weight">Per Weight (kg)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {quantityType !== 'fixed' && (
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {quantityType === 'weight' ? 'Weight (kg)' : 'Count'}
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="unitPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {quantityType === 'fixed' ? 'Price' : 'Price per Unit'}
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="p-3 bg-muted rounded-md flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calculator className="h-4 w-4" />
                                <span>Planned Total:</span>
                            </div>
                            <span className="font-bold text-lg">
                                {currency} {estimatedTotal.toFixed(2)}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            {/* Removed Actual Spend Field */}

                            <FormField
                                control={form.control}
                                name="isPurchased"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col justify-end pb-2">
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="!mt-0">Mark as Purchased</FormLabel>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                        <DialogFooter>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
