import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { MoreHorizontal, Eye, Edit, UserMinus, Crown } from 'lucide-react'
import {
  removeMemberFn,
  updateMemberRoleFn,
} from '@/server/functions/workspaces'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import type { TranslationKey } from '@/lib/i18n'
import type { WorkspaceMembers } from '@/server/lib/appwrite.types'

interface MemberListProps {
  members: WorkspaceMembers[]
  onUpdate: () => void
}

export function MemberList({ members, onUpdate }: MemberListProps) {
  const [removingMember, setRemovingMember] = useState<WorkspaceMembers | null>(
    null,
  )
  const { isOwner } = useWorkspace()
  const { t } = useI18n()

  const removeMember = useServerFn(removeMemberFn)
  const updateMemberRole = useServerFn(updateMemberRoleFn)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />
      case 'editor':
        return <Edit className="h-3 w-3" />
      default:
        return <Eye className="h-3 w-3" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'editor':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const handleRemove = async () => {
    if (!removingMember) return

    try {
      await removeMember({ data: { memberId: removingMember.$id } })
      toast.success('Member removed')
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setRemovingMember(null)
    }
  }

  const handleRoleChange = async (
    memberId: string,
    newRole: 'editor' | 'viewer',
  ) => {
    try {
      await updateMemberRole({ data: { memberId, role: newRole } })
      toast.success('Role updated')
      onUpdate()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    }
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <>
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.$id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(member.userEmail)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{member.userEmail}</p>
                <Badge
                  variant={
                    getRoleBadgeVariant(member.role) as
                      | 'default'
                      | 'secondary'
                      | 'outline'
                      | 'destructive'
                  }
                  className="mt-1 gap-1"
                >
                  {getRoleIcon(member.role)}
                  {t(`workspace_role_${member.role}` as TranslationKey)}
                </Badge>
              </div>
            </div>

            {isOwner && member.role !== 'owner' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleRoleChange(member.$id, 'editor')}
                    disabled={member.role === 'editor'}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Make Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRoleChange(member.$id, 'viewer')}
                    disabled={member.role === 'viewer'}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Make Viewer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setRemovingMember(member)}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!removingMember}
        onOpenChange={() => setRemovingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removingMember?.userEmail} from
              this workspace? They will lose access to all workspace data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
