
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
        <nav className="fixed bottom-6 left-4 right-4 z-50">
            <div className="flex items-center justify-between px-2 py-1.5 bg-background/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl ring-1 ring-black/5">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isCheck = location.pathname.startsWith(item.href) && item.href !== '/'
                    const isActive = location.pathname === item.href || (item.href !== '/dashboard' && isCheck)

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center py-1 gap-0.5 transition-all duration-300 relative',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {isActive && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary/20 rounded-b-full blur-sm" />
                            )}
                            <Icon
                                className={cn(
                                    "h-6 w-6 transition-all duration-300",
                                    isActive && "scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={cn(
                                "text-[10px] font-medium transition-all duration-300",
                                isActive ? "opacity-100 translate-y-0" : "opacity-70"
                            )}>
                                {t(item.label)}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
