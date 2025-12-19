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
  type: z.enum(['income', 'expense']),
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
  { value: 'briefcase', label: 'Work' },
  { value: 'gift', label: 'Gifts' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'smartphone', label: 'Phone' },
  { value: 'wifi', label: 'Internet' },
  { value: 'music', label: 'Music' },
  { value: 'plane', label: 'Travel' },
  { value: 'baby', label: 'Baby' },
  { value: 'paw-print', label: 'Pets' },
  { value: 'dumbbell', label: 'Fitness' },
  { value: 'shield', label: 'Insurance' },
  { value: 'landmark', label: 'Bank' },
  { value: 'receipt', label: 'Bills' },
  { value: 'wrench', label: 'Maintenance' },
]

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
  Briefcase,
  Gift,
  Coffee,
  Smartphone,
  Wifi,
  Music,
  Plane,
  Baby, // Note: verify generic lucide export, usually Baby is available. checking imports.
  PawPrint,
  Dumbbell,
  Shield,
  Landmark,
  Receipt,
  Wrench
} from 'lucide-react'

// Define this map locally for the form
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
  briefcase: Briefcase,
  gift: Gift,
  coffee: Coffee,
  smartphone: Smartphone,
  wifi: Wifi,
  music: Music,
  plane: Plane,
  baby: Baby,
  'paw-print': PawPrint,
  dumbbell: Dumbbell,
  shield: Shield,
  landmark: Landmark,
  receipt: Receipt,
  wrench: Wrench
}

function IconPreview({ name }: { name: string }) {
  // Simple mapping for display in the form
  const Icon = iconMap[name] || MoreHorizontal
  return <Icon className="h-4 w-4" />
}

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
      type: 'expense',
    },
  })

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color,
        type: 'expense',
      })
    } else {
      form.reset({
        name: '',
        icon: 'more-horizontal',
        color: '#9B87F5',
        type: 'expense',
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
            type: values.type,
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
                  <FormControl>
                    <div className="grid grid-cols-5 gap-2 border rounded-md p-2 max-h-[200px] overflow-y-auto">
                      {iconOptions.map((icon) => {
                        const isSelected = field.value === icon.value
                        return (
                          <button
                            key={icon.value}
                            type="button"
                            onClick={() => field.onChange(icon.value)}
                            className={`flex flex-col items-center justify-center p-2 rounded-md hover:bg-accent transition-colors ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background'}`}
                            title={icon.label}
                          >
                            <div className="h-5 w-5 mb-1 flex items-center justify-center">
                              {/* We can't easily render the dynamic icon component here without importing all of them or having a map available in this scope. 
                                   The iconMap was in budget-planner. Let's move iconMap to a shared utility or duplicate/expand it here. 
                                   Actually, for the form to look good, I should probably render the icons.
                                   Let's just use a simple text/icon placeholder or better yet, import the icons.
                               */}
                              <IconPreview name={icon.value} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </FormControl>
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
                        className={`w-8 h-8 rounded-full border-2 transition-all ${field.value === color.value
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
