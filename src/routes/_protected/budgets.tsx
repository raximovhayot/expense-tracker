import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { BudgetPlanner } from '@/components/budgets/budget-planner'
import { CategoryForm } from '@/components/budgets/category-form'
import { Card, CardContent } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/page-container'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import {
  listCategoriesFn,
  listMonthlyBudgetsFn,
  getBudgetOverviewFn,
  deleteCategoryFn,
} from '@/server/functions/budgets'
import {
  listBudgetItemsFn,
  deleteBudgetItemFn,
} from '@/server/functions/budget-items'
import { BudgetItemList } from '@/components/budgets/budget-item-list'
import { BudgetItemForm } from '@/components/budgets/budget-item-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] =
    useState<BudgetCategories | null>(null)
  const [deletingCategory, setDeletingCategory] =
    useState<BudgetCategories | null>(null)

  const [showCategoryList, setShowCategoryList] = useState(false)
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
  const deleteCategory = useServerFn(deleteCategoryFn)
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

  const handleEditCategory = (category: BudgetCategories) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleCloseCategoryForm = (open: boolean) => {
    setShowCategoryForm(open)
    if (!open) {
      setEditingCategory(null)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      await deleteCategory({ data: { id: deletingCategory.$id } })
      toast.success(t('budget_category_deleted'))
      loadData()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setDeletingCategory(null)
    }
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
            <Button variant="outline" onClick={() => setShowCategoryList(true)}>
              Manage Categories
            </Button>
            <Button onClick={() => setShowCategoryForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('budget_add_category')}
            </Button>
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

      {/* Category List Dialog (Management) */}
      <Dialog open={showCategoryList} onOpenChange={setShowCategoryList}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pt-4">
            {categories.map((category) => (
              <Card key={category.$id} className="card-sleek">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{
                            backgroundColor: category.color || '#9B87F5',
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        {category.isDefault && (
                          <span className="text-xs text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    {canEdit && !category.isDefault && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              handleEditCategory(category)
                              setShowCategoryList(false) // Close list to focus on form
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingCategory(category)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Form */}
      <CategoryForm
        open={showCategoryForm}
        onOpenChange={(open) => {
          handleCloseCategoryForm(open)
          if (!open && showCategoryList) {
            // If we were getting back from editing, maybe reopen list? 
            // Simplify: just close. User can reopen.
          }
        }}
        editingCategory={editingCategory}
        onSuccess={loadData}
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This
              will also delete all associated budgets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
