import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { BudgetPlanner } from '@/components/budgets/budget-planner'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/page-container'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import {
  listCategoriesFn,
  listMonthlyBudgetsFn,
  getBudgetOverviewFn,

} from '@/server/functions/budgets'
import {
  listBudgetItemsFn,
  deleteBudgetItemFn,
} from '@/server/functions/budget-items'
import { BudgetItemList } from '@/components/budgets/budget-item-list'
import { BudgetItemForm } from '@/components/budgets/budget-item-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatCurrency } from '@/lib/currency'
import type {
  BudgetCategories,
  MonthlyBudgets,
  BudgetItems,
} from '@/server/lib/appwrite.types'

interface BudgetOverviewItem {
  category: BudgetCategories
  planned: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
}

export const Route = createFileRoute('/_protected/budgets')({
  component: BudgetsPage,
})

function BudgetsPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<BudgetCategories[]>([])
  const [budgets, setBudgets] = useState<MonthlyBudgets[]>([])
  const [overview, setOverview] = useState<BudgetOverviewItem[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)


  const [selectedCategory, setSelectedCategory] = useState<BudgetCategories | null>(null)

  // Budget Items State
  const [budgetItems, setBudgetItems] = useState<BudgetItems[]>([])
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<BudgetItems | null>(null)
  const [deletingItem, setDeletingItem] = useState<BudgetItems | null>(null)

  const { workspace, canEdit, currency } = useWorkspace()
  const { t } = useI18n()

  const fetchCategories = useServerFn(listCategoriesFn)
  const fetchBudgets = useServerFn(listMonthlyBudgetsFn)
  const fetchOverview = useServerFn(getBudgetOverviewFn)

  const fetchBudgetItems = useServerFn(listBudgetItemsFn)
  const deleteBudgetItem = useServerFn(deleteBudgetItemFn)

  const loadData = async () => {
    if (!workspace) return

    setLoading(true)
    try {
      const [categoriesResult, budgetsResult, overviewResult, itemsResult] =
        await Promise.all([
          fetchCategories({ data: { workspaceId: workspace.$id } }),
          fetchBudgets({ data: { workspaceId: workspace.$id, year, month } }),
          fetchOverview({ data: { workspaceId: workspace.$id, year, month } }),
          fetchBudgetItems({ data: { workspaceId: workspace.$id, year, month } }),
        ])

      setCategories(categoriesResult.categories)
      setBudgets(budgetsResult.budgets)
      setOverview(overviewResult.overview)
      setBudgetItems(itemsResult.items)
    } catch (error) {
      console.error('Failed to load budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [workspace, year, month])

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear)
    setMonth(newMonth)
  }



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



  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a workspace to manage budgets
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('budget_title')}</h1>
          <p className="text-muted-foreground mt-1">
            Plan your monthly budgets and track spending by category
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {/* Category management moved to settings */}
          </div>
        )}
      </div>

      <BudgetPlanner
        categories={categories}
        budgets={budgets}
        overview={overview}
        year={year}
        month={month}
        onMonthChange={handleMonthChange}
        onUpdate={loadData}
        onCategoryClick={setSelectedCategory}
      />





      {/* Category Details Sheet */}
      <Sheet open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-xl w-full">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div
                className="w-3 h-10 rounded-full"
                style={{ backgroundColor: selectedCategory?.color || '#333' }}
              />
              {selectedCategory?.name} Details
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Summary for this category */}
            {(() => {
              if (!selectedCategory) return null
              const overviewItem = overview.find(o => o.category.$id === selectedCategory.$id)
              if (!overviewItem) return <p>No budget data.</p>


              return (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Planned</p>
                      <p className="text-xl font-bold">{formatCurrency(overviewItem.planned, currency)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-xl font-bold">{formatCurrency(overviewItem.spent, currency)}</p>
                    </CardContent>
                  </Card>
                </div>
              )
            })()}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Transactions</h3>
                {canEdit && (
                  <Button size="sm" onClick={() => setShowItemForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                )}
              </div>

              <BudgetItemList
                items={budgetItems.filter(i => selectedCategory && i.categoryId === selectedCategory.$id)}
                categories={categories}
                onEdit={(item) => {
                  // Close sheet? No, open edit form on top? 
                  // BudgetItemForm is a Dialog, so it should stack.
                  handleEditItem(item)
                }}
                onDelete={setDeletingItem}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Budget Item Form */}
      {/* We need to pass the selected category to the form via default values if we are adding new? 
          BudgetItemForm takes 'categories'. 
          If I click 'Add Item' inside the sheet, I probably want it pre-filled with the current category.
          BudgetItemForm implementation check needed. It likely uses a select for category.
          I can pass a 'defaultCategoryId' if I modify it, or just let user pick.
          For now, just standard form.
      */}
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
        // preSelectedCategoryId={selectedCategory?.$id} // Optional enhancement for later
        onSuccess={loadData}
      />

      {/* Delete Item Confirmation */}
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


