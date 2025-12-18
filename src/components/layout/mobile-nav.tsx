import { Link, useLocation } from '@tanstack/react-router'
import {
    LayoutDashboard,
    PiggyBank,
    Receipt,
    Settings,
    Plus,
    Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/use-i18n'

export function MobileNav() {
    const location = useLocation()
    const { t } = useI18n()

    const navItems = [
        { href: '/dashboard', label: 'nav_dashboard', icon: LayoutDashboard },
        { href: '/budgets', label: 'nav_budgets', icon: PiggyBank },
        { href: '/income', label: 'nav_income', icon: Wallet },
        { href: '/transactions', label: 'nav_transactions', icon: Receipt },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg pb-safe-area-bottom">
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
                            <span className="text-[10px] font-medium">{t(item.label as any)}</span>
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
                            <span className="text-[10px] font-medium">{t(item.label as any)}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
