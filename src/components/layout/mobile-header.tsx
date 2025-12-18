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

interface MobileHeaderProps {
    onCreateWorkspace: () => void
}

export function MobileHeader({ onCreateWorkspace }: MobileHeaderProps) {
    const { signOut } = useAuth()
    const { t } = useI18n()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg pt-safe-area-top">
            <div className="flex h-14 items-center justify-between px-4">
                {/* Left: Logo/Home */}
                <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <PiggyBank className="h-5 w-5 text-primary-foreground" />
                    </div>
                </Link>

                {/* Center: Workspace Switcher (Compact) */}
                <div className="flex-1 max-w-[200px] mx-4">
                    <WorkspaceSwitcher onCreateNew={onCreateWorkspace} collapsed={false} className="w-full border-none shadow-none bg-transparent hover:bg-accent/50" />
                </div>

                {/* Right: User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                            <User className="h-5 w-5" />
                            <span className="sr-only">User menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to="/preferences">{t('nav_preferences')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => signOut()}>
                            {t('nav_sign_out')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
