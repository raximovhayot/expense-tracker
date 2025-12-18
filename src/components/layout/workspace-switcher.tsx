import { useState } from 'react'
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'

interface WorkspaceSwitcherProps {
  onCreateNew?: () => void
  collapsed?: boolean
  className?: string
}

export function WorkspaceSwitcher({
  onCreateNew,
  collapsed,
  className,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false)
  const { workspace, workspaces, setWorkspace } = useWorkspace()
  const { t } = useI18n()

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            aria-label={t('workspace_switch')}
          >
            <Building2 className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start" side="right">
          <Command>
            <CommandInput placeholder={t('search')} />
            <CommandList>
              <CommandEmpty>{t('workspace_no_workspaces')}</CommandEmpty>
              <CommandGroup>
                {workspaces.map((ws) => (
                  <CommandItem
                    key={ws.$id}
                    value={ws.name}
                    onSelect={() => {
                      setWorkspace(ws)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{ws.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {ws.description || ''}
                        </span>
                      </div>
                    </div>
                    {workspace?.$id === ws.$id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {onCreateNew && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false)
                        onCreateNew()
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('workspace_create')}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto py-2", className)}
        >
          {workspace ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-medium text-sm truncate max-w-[140px]">
                  {workspace.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {workspace.description || ''}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {t('workspace_switch')}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={t('search')} />
          <CommandList>
            <CommandEmpty>{t('workspace_no_workspaces')}</CommandEmpty>
            <CommandGroup heading={t('workspace_title')}>
              {workspaces.map((ws) => (
                <CommandItem
                  key={ws.$id}
                  value={ws.name}
                  onSelect={() => {
                    setWorkspace(ws)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{ws.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ws.description || ''}
                      </span>
                    </div>
                  </div>
                  {workspace?.$id === ws.$id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      onCreateNew()
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('workspace_create')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
