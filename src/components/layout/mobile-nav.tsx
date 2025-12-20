
import { Link, useLocation } from '@tanstack/react-router'
import { type TranslationKey } from '@/lib/i18n'
import {
    PiggyBank,
    Receipt,
    HandCoins,
    Repeat,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

export function MobileNav() {
    const location = useLocation()
    const { t } = useI18n()

    const navItems: { href: string; label: TranslationKey; icon: LucideIcon }[] = [
        { href: '/budgets', label: 'nav_budgets', icon: PiggyBank },
        { href: '/transactions', label: 'nav_transactions', icon: Receipt },
        { href: '/recurring', label: 'nav_recurring', icon: Repeat },
        { href: '/debts', label: 'nav_debts', icon: HandCoins },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
            <div className="flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isCheck = location.pathname.startsWith(item.href) && item.href !== '/'
                    const isActive = location.pathname === item.href || (item.href !== '/dashboard' && isCheck)

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center py-2 gap-1 transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon
                                className="h-6 w-6"
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="text-[10px] font-medium leading-none">
                                {t(item.label)}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
