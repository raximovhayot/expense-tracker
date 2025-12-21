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
import { PageContainer } from '@/components/layout/page-container'
import { formatCurrency } from '@/lib/currency'

export const Route = createFileRoute('/_protected/debts')({
    component: DebtsPage,
})

function DebtsPage() {
    const [loading, setLoading] = useState(true)
    const [debts, setDebts] = useState<Debts[]>([])
    const [showDialog, setShowDialog] = useState(false)
    const [editingDebt, setEditingDebt] = useState<Debts | null>(null)

    const { workspace, canEdit, currency } = useWorkspace()
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
        <PageContainer fullWidth={false} className="max-w-6xl">
            <div className="flex items-center justify-center lg:justify-between mb-6">
                <div className="text-center lg:text-left">
                    <h1 className="text-2xl font-bold tracking-tight">{t('debts_title')}</h1>
                    <p className="text-muted-foreground mt-1">
                        Track money lent and borrowed
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => setShowDialog(true)} className="hidden lg:flex">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('debts_add')}
                    </Button>
                )}
            </div>

            {/* Mobile Add Button */}
            {canEdit && (
                <div className="lg:hidden w-full mb-6">
                    <Button onClick={() => setShowDialog(true)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('debts_add')}
                    </Button>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('debts_total_lent')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {formatCurrency(totalLent, currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active loans given
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('debts_total_borrowed')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {formatCurrency(totalBorrowed, currency)}
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
                currency={currency}
            />

            <DebtDialog
                open={showDialog}
                onOpenChange={handleCloseDialog}
                editingDebt={editingDebt}
                onSuccess={loadData}
            />
        </PageContainer>
    )
}
