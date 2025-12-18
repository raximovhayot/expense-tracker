import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Receipt,
  RefreshCw,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WorkspaceSwitcher } from './workspace-switcher'
import { useI18n } from '@/hooks/use-i18n'
import type { TranslationKey } from '@/lib/i18n'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'

interface NavItem {
  labelKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNavItems: NavItem[] = [
  { labelKey: 'nav_dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'nav_income', href: '/income', icon: Wallet },
  { labelKey: 'nav_budgets', href: '/budgets', icon: PiggyBank },
  { labelKey: 'nav_transactions', href: '/transactions', icon: Receipt },
  { labelKey: 'nav_recurring', href: '/recurring', icon: RefreshCw },
]

const settingsNavItems: NavItem[] = [
  {
    labelKey: 'nav_workspace_settings',
    href: '/workspace-settings',
    icon: Settings,
  },
  { labelKey: 'nav_preferences', href: '/preferences', icon: User },
]

interface AppSidebarProps {
  onCreateWorkspace?: () => void
}

export function AppSidebar({ onCreateWorkspace }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { t } = useI18n()
  const { signOut } = useAuth()

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href
    const Icon = item.icon
    const label = t(item.labelKey as TranslationKey)

    const linkContent = (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
          collapsed && 'justify-center px-2',
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
        {!collapsed && <span>{label}</span>}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center h-16 px-4 border-b',
            collapsed && 'justify-center px-2',
          )}
        >
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">BudgetFlow</span>
            </Link>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Workspace Switcher */}
        <div className={cn('p-4', collapsed && 'p-2')}>
          <WorkspaceSwitcher
            onCreateNew={onCreateWorkspace}
            collapsed={collapsed}
          />
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>

          <Separator className="my-4" />

          <nav className="space-y-1">
            {settingsNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t('nav_sign_out')}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
              {t('nav_sign_out')}
            </Button>
          )}
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  )
}
