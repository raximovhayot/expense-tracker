import { format } from 'date-fns'
import {
    MoreHorizontal,
    Pencil,
    Trash,
    Check,
    X,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'
import type { Debts } from '@/server/lib/appwrite.types'
import { useServerFn } from '@tanstack/react-start'
import { deleteDebtFn, updateDebtFn } from '@/server/functions/debts'
import { toast } from 'sonner'
import { formatCurrency, type Currency } from '@/lib/currency'

interface DebtListProps {
    debts: Debts[]
    onEdit: (debt: Debts) => void
    onUpdate: () => void
    currency: string
}

export function DebtList({ debts, onEdit, onUpdate, currency }: DebtListProps) {
    const { t } = useI18n()
    const deleteDebt = useServerFn(deleteDebtFn)
    const updateDebt = useServerFn(updateDebtFn)

    const handleDelete = async (debt: Debts) => {
        try {
            await deleteDebt({ data: { id: debt.$id, workspaceId: debt.workspaceId } })
            toast.success(t('debts_deleted'))
            onUpdate()
        } catch (error) {
            console.error('Failed to delete debt:', error)
            toast.error(t('error_generic'))
        }
    }

    const handleTogglePaid = async (debt: Debts) => {
        try {
            await updateDebt({
                data: {
                    id: debt.$id,
                    workspaceId: debt.workspaceId,
                    isPaid: !debt.isPaid,
                },
            })
            toast.success(t('debts_updated'))
            onUpdate()
        } catch (error) {
            console.error('Failed to update debt:', error)
            toast.error(t('error_generic'))
        }
    }

    if (debts.length === 0) {
        return (
            <Card className="card-sleek">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-card-foreground">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('debts_no_debts')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('debts_add_first')}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('debts_person')}</TableHead>
                        <TableHead>{t('debts_type')}</TableHead>
                        <TableHead>{t('debts_amount')}</TableHead>
                        <TableHead>{t('debts_due_date')}</TableHead>
                        <TableHead>{t('debts_is_paid')}</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {debts.map((debt) => (
                        <TableRow key={debt.$id}>
                            <TableCell className="font-medium">
                                <div>{debt.personName}</div>
                                {debt.description && (
                                    <div className="text-xs text-muted-foreground">
                                        {debt.description}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={debt.type === 'lent' ? 'default' : 'secondary'}
                                    className={cn(
                                        'gap-1',
                                        debt.type === 'lent'
                                            ? 'bg-green-500 hover:bg-green-600'
                                            : 'bg-orange-500 hover:bg-orange-600',
                                    )}
                                >
                                    {debt.type === 'lent' ? (
                                        <ArrowRight className="h-3 w-3" />
                                    ) : (
                                        <ArrowLeft className="h-3 w-3" />
                                    )}
                                    {debt.type === 'lent' ? 'Lent' : 'Borrowed'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="font-mono font-medium">
                                    {formatCurrency(debt.amount, (debt.currency || currency) as Currency)}
                                </div>
                            </TableCell>
                            <TableCell>
                                {debt.dueDate ? (
                                    format(new Date(debt.dueDate), 'PP')
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={debt.isPaid ? 'outline' : 'destructive'} className={cn(debt.isPaid && "text-green-600 border-green-600 bg-green-50")}>
                                    {debt.isPaid ? t('yes') : t('no')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{t('add')}</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onEdit(debt)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            {t('debts_edit')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleTogglePaid(debt)}>
                                            {debt.isPaid ? (
                                                <>
                                                    <X className="mr-2 h-4 w-4" />
                                                    {t('debts_mark_unpaid')}
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    {t('debts_mark_paid')}
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => handleDelete(debt)}
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            {t('debts_deleted')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
