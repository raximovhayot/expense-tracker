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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createCategoryFn, updateCategoryFn } from '@/server/functions/budgets'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { Loader2 } from 'lucide-react'
import type { BudgetCategories } from '@/server/lib/appwrite.types'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  icon: z.string().nullable(),
  color: z.string().nullable(),
})

type FormValues = z.infer<typeof formSchema>

const iconOptions = [
  { value: 'home', label: 'Home' },
  { value: 'utensils', label: 'Food' },
  { value: 'car', label: 'Transport' },
  { value: 'zap', label: 'Utilities' },
  { value: 'heart', label: 'Health' },
  { value: 'film', label: 'Entertainment' },
  { value: 'shopping-bag', label: 'Shopping' },
  { value: 'book', label: 'Education' },
  { value: 'user', label: 'Personal' },
  { value: 'more-horizontal', label: 'Other' },
]

const colorOptions = [
  { value: '#9B87F5', label: 'Purple' },
  { value: '#22C55E', label: 'Green' },
  { value: '#0EA5E9', label: 'Blue' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#D946EF', label: 'Pink' },
  { value: '#F97316', label: 'Orange' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#8E9196', label: 'Gray' },
]

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory?: BudgetCategories | null
  onSuccess?: () => void
}

export function CategoryForm({
  open,
  onOpenChange,
  editingCategory,
  onSuccess,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false)
  const { workspace } = useWorkspace()
  const { t } = useI18n()

  const createCategory = useServerFn(createCategoryFn)
  const updateCategory = useServerFn(updateCategoryFn)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      icon: 'more-horizontal',
      color: '#9B87F5',
    },
  })

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color,
      })
    } else {
      form.reset({
        name: '',
        icon: 'more-horizontal',
        color: '#9B87F5',
      })
    }
  }, [editingCategory, form])

  async function onSubmit(values: FormValues) {
    if (!workspace) return

    setLoading(true)
    try {
      if (editingCategory) {
        await updateCategory({
          data: {
            id: editingCategory.$id,
            name: values.name,
            icon: values.icon,
            color: values.color,
          },
        })
        toast.success(t('budget_category_updated'))
      } else {
        await createCategory({
          data: {
            workspaceId: workspace.$id,
            name: values.name,
            icon: values.icon,
            color: values.color,
          },
        })
        toast.success(t('budget_category_created'))
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {editingCategory
              ? t('budget_edit_category')
              : t('budget_add_category')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('budget_category_name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Category name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('budget_category_icon')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
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
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('budget_category_color')}</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => field.onChange(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          field.value === color.value
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                  <FormMessage />
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
                {editingCategory ? t('update') : t('create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
