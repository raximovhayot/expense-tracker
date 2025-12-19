import { Link, useLocation } from '@tanstack/react-router'
import { type TranslationKey } from '@/lib/i18n'
import {
    LayoutDashboard,
    PiggyBank,
    Receipt,
    Plus,
    HandCoins,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/use-i18n'

export function MobileNav() {
    const location = useLocation()
    const { t } = useI18n()

    const navItems: { href: string; label: TranslationKey; icon: LucideIcon }[] = [
        { href: '/dashboard', label: 'nav_dashboard', icon: LayoutDashboard },
        { href: '/budgets', label: 'nav_budgets', icon: PiggyBank },
        { href: '/transactions', label: 'nav_transactions', icon: Receipt },
        { href: '/debts', label: 'nav_debts', icon: HandCoins },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/60 backdrop-blur-xl pb-safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-around p-2">
                {navItems.slice(0, 2).map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]',
                                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{t(item.label)}</span>
                        </Link>
                    )
                })}

                <div className="relative -top-6">
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 border-4 border-background"
                        onClick={() => {
                            // TODO: Open quick add action
                            console.log('Open quick add')
                        }}
                    >
                        <Plus className="h-8 w-8" />
                    </Button>
                </div>

                {navItems.slice(2).map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]',
                                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium">{t(item.label)}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
