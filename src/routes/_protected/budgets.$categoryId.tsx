import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/page-container'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import {
  listCategoriesFn,
  getBudgetOverviewFn,
} from '@/server/functions/budgets'
import {
  listBudgetItemsFn,
  deleteBudgetItemFn,
} from '@/server/functions/budget-items'
import { BudgetItemList } from '@/components/budgets/budget-item-list'
import { BudgetItemForm } from '@/components/budgets/budget-item-form'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  ArrowLeft,
  Trash2,
  Calendar,
  Wallet,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { CategoryIcon } from '@/components/budgets/category-icon'
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
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type {
  BudgetCategories,
  BudgetItems,
} from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/budgets/$categoryId')({
  component: BudgetDetailsPage,
})

function BudgetDetailsPage() {
  const params = Route.useParams()
  const navigate = useNavigate()
  const { categoryId } = params

  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<BudgetCategories | null>(null)
  const [categories, setCategories] = useState<BudgetCategories[]>([]) // For the form
  const [overviewItem, setOverviewItem] = useState<{
    planned: number
    spent: number
    remaining: number
    percentage: number
    isOverBudget: boolean
  } | null>(null)

  // Year and Month state - defaults to current or could be passed via query params? 
  // For now, consistent with main page, default to current.
  // Ideally, we should read from query params to keep context.
  // Let's rely on standard current date for now, or better, existing context if possible.
  // Since we don't have global context for this yet, let's use local state initialized to now.
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const [budgetItems, setBudgetItems] = useState<BudgetItems[]>([])
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItems | null>(null)
  const [deletingItem, setDeletingItem] = useState<BudgetItems | null>(null)

  const { workspace, canEdit, currency } = useWorkspace()
  const { t } = useI18n()

  const fetchCategories = useServerFn(listCategoriesFn)
  const fetchOverview = useServerFn(getBudgetOverviewFn)
  const fetchBudgetItems = useServerFn(listBudgetItemsFn)
  const deleteBudgetItem = useServerFn(deleteBudgetItemFn)

  const loadData = async () => {
    if (!workspace || !categoryId) return

    setLoading(true)
    try {
      // Fetch specific data
      const [categoriesResult, overviewResult, itemsResult] = await Promise.all([
        fetchCategories({ data: { workspaceId: workspace.$id } }),
        fetchOverview({ data: { workspaceId: workspace.$id, year, month } }), // This fetches all, we filter locally
        fetchBudgetItems({ data: { workspaceId: workspace.$id, year, month } })
      ])

      const foundCategory = categoriesResult.categories.find(c => c.$id === categoryId) || null
      setCategory(foundCategory)
      setCategories(categoriesResult.categories)

      const foundOverview = overviewResult.overview.find(o => o.category.$id === categoryId)
      if (foundOverview) {
        setOverviewItem({
          planned: foundOverview.planned,
          spent: foundOverview.spent,
          remaining: foundOverview.remaining,
          percentage: foundOverview.percentage,
          isOverBudget: foundOverview.isOverBudget
        })
      } else {
        setOverviewItem(null)
      }

      // Filter items for this category
      const filteredItems = itemsResult.items.filter(i => i.categoryId === categoryId)
      setBudgetItems(filteredItems)

    } catch (error) {
      console.error('Failed to load budget details:', error)
      toast.error('Failed to load details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [workspace, categoryId, year, month])

  const handleEditItem = (item: BudgetItems) => {
    setEditingItem(item)
    setShowItemForm(true)
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return
    try {
      await deleteBudgetItem({ data: { id: deletingItem.$id } })
      toast.success('Budget item deleted')
      loadData()
    } catch {
      toast.error(t('error_generic'))
    } finally {
      setDeletingItem(null)
    }
  }

  if (loading && !category) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    )
  }

  if (!category) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold">Category not found</h2>
          <Button variant="link" onClick={() => navigate({ to: '/budgets' })}>
            Back to Budgets
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/budgets' })} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <span style={{ color: category.color || '#333' }}>
                <CategoryIcon name={category.icon} className="h-5 w-5" />
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
              <p className="text-muted-foreground text-sm">Budget Details</p>
            </div>
          </div>
        </div>

        {!overviewItem && (
          <div className="p-8 text-center rounded-xl border border-dashed text-muted-foreground bg-muted/20">
            No budget set for this month.
          </div>
        )}

        {overviewItem && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Summary Cards */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4" /> Planned
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(overviewItem.planned, currency)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Spent</p>
                  <p className={cn("text-2xl font-bold", overviewItem.isOverBudget ? "text-destructive" : "text-primary")}>
                    {formatCurrency(overviewItem.spent, currency)}
                  </p>
                </div>
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", overviewItem.isOverBudget ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                  {overviewItem.isOverBudget ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm md:col-span-2 lg:col-span-1">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress</span>
                  <span className={cn("text-sm font-bold", overviewItem.isOverBudget ? "text-destructive" : "text-muted-foreground")}>
                    {overviewItem.percentage}% Used
                  </span>
                </div>
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-500 rounded-full", overviewItem.isOverBudget ? "bg-destructive" : "bg-primary")}
                    style={{ width: `${Math.min(overviewItem.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {overviewItem.isOverBudget
                    ? `Over by ${formatCurrency(Math.abs(overviewItem.remaining), currency)}`
                    : `${formatCurrency(overviewItem.remaining, currency)} remaining`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold tracking-tight">Transactions</h3>
            {canEdit && (
              <Button onClick={() => setShowItemForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <BudgetItemList
              items={budgetItems}
              categories={categories}
              onEdit={handleEditItem}
              onDelete={setDeletingItem}
            />
          </div>
        </div>
      </div>

      <BudgetItemForm
        open={showItemForm}
        onOpenChange={(open) => {
          setShowItemForm(open)
          if (!open) setEditingItem(null)
        }}
        year={year}
        month={month}
        categories={categories}
        editingItem={editingItem}
        defaultCategoryId={categoryId}
        onSuccess={loadData}
      />

      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deletingItem?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive hover:bg-destructive/90">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </PageContainer>
  )
}
