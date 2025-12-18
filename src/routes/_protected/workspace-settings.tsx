import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { MemberList } from '@/components/workspace/member-list'
import { InviteMemberDialog } from '@/components/workspace/invite-member-dialog'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import {
  updateWorkspaceFn,
  deleteWorkspaceFn,
  listMembersFn,
  listInvitationsFn,
  cancelInvitationFn,
} from '@/server/functions/workspaces'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, UserPlus, Trash2, Mail, X } from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n'
import type {
  WorkspaceMembers,
  WorkspaceInvitations,
} from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/workspace-settings')({
  component: WorkspaceSettingsPage,
})

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  currency: z.enum(['USD', 'UZS']),
  language: z.enum(['en', 'uz']),
})

type FormValues = z.infer<typeof formSchema>

function WorkspaceSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [members, setMembers] = useState<WorkspaceMembers[]>([])
  const [invitations, setInvitations] = useState<WorkspaceInvitations[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  const { workspace, isOwner, updateWorkspace, removeWorkspace } =
    useWorkspace()
  const { t } = useI18n()
  const navigate = useNavigate()

  const updateWorkspaceApi = useServerFn(updateWorkspaceFn)
  const deleteWorkspaceApi = useServerFn(deleteWorkspaceFn)
  const fetchMembers = useServerFn(listMembersFn)
  const fetchInvitations = useServerFn(listInvitationsFn)
  const cancelInvitation = useServerFn(cancelInvitationFn)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      currency: 'USD',
      language: 'en',
    },
  })

  const loadData = async () => {
    if (!workspace) return

    setLoading(true)
    try {
      const [membersResult, invitationsResult] = await Promise.all([
        fetchMembers({ data: { workspaceId: workspace.$id } }),
        fetchInvitations({ data: { workspaceId: workspace.$id } }),
      ])

      setMembers(membersResult.members)
      setInvitations(invitationsResult.invitations)

      form.reset({
        name: workspace.name,
        description: workspace.description || '',
        currency: workspace.currency as FormValues['currency'],
        language: workspace.language as FormValues['language'],
      })
    } catch (error) {
      console.error('Failed to load workspace data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [workspace])

  async function onSubmit(values: FormValues) {
    if (!workspace) return

    setSaving(true)
    try {
      await updateWorkspaceApi({
        data: {
          id: workspace.$id,
          name: values.name,
          description: values.description || null,
          currency: values.currency,
          language: values.language,
        },
      })

      updateWorkspace(workspace.$id, {
        name: values.name,
        description: values.description || null,
        currency: values.currency,
        language: values.language,
      })

      toast.success(t('workspace_updated'))
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!workspace) return

    setDeleting(true)
    try {
      await deleteWorkspaceApi({ data: { id: workspace.$id } })
      removeWorkspace(workspace.$id)
      toast.success(t('workspace_deleted'))
      navigate({ to: '/dashboard' })
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation({ data: { invitationId } })
      toast.success('Invitation cancelled')
      loadData()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    }
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a workspace to view settings
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{t('workspace_settings')}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspace settings and team members
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update your workspace name, description, and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('workspace_name')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isOwner} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('workspace_description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        {...field}
                        disabled={!isOwner}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('workspace_currency')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isOwner}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">$ USD</SelectItem>
                          <SelectItem value="UZS">so'm UZS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('workspace_language')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!isOwner}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">{t('language_en')}</SelectItem>
                          <SelectItem value="uz">{t('language_uz')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isOwner && (
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('save')}
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('workspace_members')}</CardTitle>
              <CardDescription>
                Manage who has access to this workspace
              </CardDescription>
            </div>
            {isOwner && (
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t('workspace_invite')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MemberList members={members} onUpdate={loadData} />
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('workspace_invitations')}</CardTitle>
            <CardDescription>
              Pending invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.$id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{invitation.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          `workspace_role_${invitation.role}` as TranslationKey,
                        )}{' '}
                        • {t('workspace_pending')}
                      </p>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelInvitation(invitation.$id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that will permanently affect your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('workspace_delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('workspace_delete')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('workspace_delete_confirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={loadData}
      />
    </div>
  )
}
