import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { DebtList } from '@/components/debts/debt-list'
import { DebtDialog } from '@/components/debts/debt-dialog'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { listDebtsFn } from '@/server/functions/debts'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import type { Debts } from '@/server/lib/appwrite.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_protected/debts')({
    component: DebtsPage,
})

function DebtsPage() {
    const [loading, setLoading] = useState(true)
    const [debts, setDebts] = useState<Debts[]>([])
    const [showDialog, setShowDialog] = useState(false)
    const [editingDebt, setEditingDebt] = useState<Debts | null>(null)

    const { workspace, canEdit } = useWorkspace()
    const { t } = useI18n()
    const fetchDebts = useServerFn(listDebtsFn)

    const loadData = async () => {
        if (!workspace) return

        setLoading(true)
        try {
            const result = await fetchDebts({
                data: { workspaceId: workspace.$id },
            })
            setDebts(result.debts)
        } catch (error) {
            console.error('Failed to load debts:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [workspace])

    const handleEdit = (debt: Debts) => {
        setEditingDebt(debt)
        setShowDialog(true)
    }

    const handleCloseDialog = (open: boolean) => {
        setShowDialog(open)
        if (!open) {
            setEditingDebt(null)
        }
    }

    const totalLent = debts
        .filter((d) => d.type === 'lent' && !d.isPaid)
        .reduce((sum, d) => sum + d.amount, 0)

    const totalBorrowed = debts
        .filter((d) => d.type === 'borrowed' && !d.isPaid)
        .reduce((sum, d) => sum + d.amount, 0)

    if (!workspace) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                    Select a workspace to view debts
                </p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('debts_title')}</h1>
                    <p className="text-muted-foreground mt-1">
                        Track money lent and borrowed
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => setShowDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('debts_add')}
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('debts_total_lent')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalLent)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active loans given
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('debts_total_borrowed')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBorrowed)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active debts owed
                        </p>
                    </CardContent>
                </Card>
            </div>

            <DebtList
                debts={debts}
                onEdit={handleEdit}
                onUpdate={loadData}
            />

            <DebtDialog
                open={showDialog}
                onOpenChange={handleCloseDialog}
                editingDebt={editingDebt}
                onSuccess={loadData}
            />
        </div>
    )
}
