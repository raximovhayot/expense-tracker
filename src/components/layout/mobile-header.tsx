import { PiggyBank, User } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { WorkspaceSwitcher } from './workspace-switcher'
import { useAuth } from '@/hooks/use-auth'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
    onCreateWorkspace: () => void
}

export function MobileHeader({ onCreateWorkspace }: MobileHeaderProps) {
    const { signOut } = useAuth()
    const { t } = useI18n()

    return (
        <header className={cn(
            "sticky top-0 z-40 w-full pt-[env(safe-area-inset-top)] transition-all",
            "bg-background border-b border-border shadow-sm"
        )}>
            <div className="flex h-14 items-center justify-between px-4">
                {/* Left: Logo/Home */}
                <Link to="/budgets" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                        <PiggyBank className="h-5 w-5 text-primary-foreground" />
                    </div>
                </Link>

                {/* Center: Workspace Switcher (Compact) */}
                <div className="flex-1 max-w-[200px] mx-2">
                    <WorkspaceSwitcher
                        onCreateNew={onCreateWorkspace}
                        collapsed={false}
                        className="w-full border-none shadow-none bg-transparent hover:bg-muted/50 h-9"
                    />
                </div>

                {/* Right: User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border bg-background text-muted-foreground hover:text-primary hover:bg-muted">
                            <User className="h-4 w-4" />
                            <span className="sr-only">User menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                            <Link to="/preferences">{t('nav_preferences')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => signOut()}>
                            {t('nav_sign_out')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
