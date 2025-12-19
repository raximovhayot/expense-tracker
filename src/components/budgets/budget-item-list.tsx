import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { BudgetItems, BudgetCategories } from '@/server/lib/appwrite.types'
import { Edit, Trash2, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { TransactionForm } from '../transactions/transaction-form'
import { cn } from '@/lib/utils'

interface BudgetItemListProps {
    items: BudgetItems[]
    categories: BudgetCategories[]
    onEdit: (item: BudgetItems) => void
    onDelete: (item: BudgetItems) => void
}

export function BudgetItemList({
    items,
    categories,
    onEdit,
    onDelete,
}: BudgetItemListProps) {
    const [transactionFormOpen, setTransactionFormOpen] = useState(false)

    // Helpers
    const getCategoryName = (id: string | null) => {
        if (!id) return 'Uncategorized'
        return categories.find((c) => c.$id === id)?.name || 'Unknown'
    }

    const getCategoryColor = (id: string | null) => {
        return categories.find((c) => c.$id === id)?.color || '#94a3b8'
    }

    // Group items by Category ?? Or just list them? 
    // Let's do a simple list sorted by category for now.
    const sortedItems = [...items].sort((a, b) => {
        const catA = getCategoryName(a.categoryId)
        const catB = getCategoryName(b.categoryId)
        return catA.localeCompare(catB)
    })

    return (
        <div className="space-y-3">
            {sortedItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No planned items for this month.
                </div>
            )}

            {sortedItems.map((item) => {
                const actual = item.actualAmount || 0
                const planned = item.plannedAmount
                const percent = Math.min((actual / planned) * 100, 100)
                const isOverBudget = actual > planned
                const isDone = item.isPurchased

                return (
                    <Card key={item.$id} className={cn("transition-colors", isDone && "bg-muted/30")}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">

                                {/* Left: Icon & Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className="w-1 h-10 rounded-full shrink-0"
                                        style={{ backgroundColor: getCategoryColor(item.categoryId) }}
                                    />

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={cn("font-medium", isDone && "line-through text-muted-foreground")}>
                                                {item.name}
                                            </h3>
                                            {isDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            {item.quantityType !== 'fixed' && (
                                                <span className="mr-2">
                                                    {item.quantity} {item.quantityType === 'weight' ? 'kg' : 'x'} @ {item.unitPrice}
                                                </span>
                                            )}
                                            <span className="opacity-75">{getCategoryName(item.categoryId)}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Middle: Progress */}
                                <div className="flex-1 max-w-[200px] hidden md:block space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>{item.currency} {actual.toFixed(2)}</span>
                                        <span className="text-muted-foreground">of {item.currency} {planned.toFixed(2)}</span>
                                    </div>
                                    <Progress
                                        value={percent}
                                        className={cn("h-2", isOverBudget && "[&>div]:bg-destructive")}
                                    />
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right md:hidden">
                                        <div className="font-medium">{item.currency} {actual.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">/ {planned.toFixed(2)}</div>
                                    </div>

                                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                            </div>
                        </CardContent>
                    </Card>
                )
            })}


            <TransactionForm
                open={transactionFormOpen}
                onOpenChange={setTransactionFormOpen}
                categories={categories}
                onSuccess={() => {
                    // Ideally we should invalidate the router or refresh data here
                    // navigation.invalidate() 
                }}
            />
        </div >
    )
}
