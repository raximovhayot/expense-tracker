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
import {
  listCategoriesFn,
  deleteCategoryFn,
} from '@/server/functions/budgets'
import { CategoryForm } from '@/components/budgets/category-form'
import { CategoryIcon } from '@/components/budgets/category-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, UserPlus, Trash2, Mail, X, Plus, Edit, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TranslationKey } from '@/lib/i18n'
import type {
  WorkspaceMembers,
  WorkspaceInvitations,
  BudgetCategories,
} from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/workspace-settings')({
  component: WorkspaceSettingsPage,
})

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

function WorkspaceSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [members, setMembers] = useState<WorkspaceMembers[]>([])
  const [invitations, setInvitations] = useState<WorkspaceInvitations[]>([])
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  // Category State
  const [categories, setCategories] = useState<BudgetCategories[]>([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategories | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<BudgetCategories | null>(null)



  const { workspace, isOwner, updateWorkspace, removeWorkspace } =
    useWorkspace()
  const { t } = useI18n()
  const navigate = useNavigate()

  const updateWorkspaceApi = useServerFn(updateWorkspaceFn)
  const deleteWorkspaceApi = useServerFn(deleteWorkspaceFn)
  const fetchMembers = useServerFn(listMembersFn)
  const fetchInvitations = useServerFn(listInvitationsFn)
  const cancelInvitation = useServerFn(cancelInvitationFn)

  const fetchCategories = useServerFn(listCategoriesFn)
  const deleteCategory = useServerFn(deleteCategoryFn)



  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const loadData = async () => {
    if (!workspace) return

    setLoading(true)
    try {
      const [membersResult, invitationsResult, categoriesResult] =
        await Promise.all([
          fetchMembers({ data: { workspaceId: workspace.$id } }),
          fetchInvitations({ data: { workspaceId: workspace.$id } }),
          fetchCategories({ data: { workspaceId: workspace.$id } }),
        ])

      setMembers(membersResult.members)
      setInvitations(invitationsResult.invitations)
      setCategories(categoriesResult.categories)

      form.reset({
        name: workspace.name,
        description: workspace.description || '',
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
        },
      })

      updateWorkspace(workspace.$id, {
        name: values.name,
        description: values.description || null,
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
      navigate({ to: '/budgets' })
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

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      await deleteCategory({ data: { id: deletingCategory.$id } })
      toast.success(t('budget_category_deleted'))
      loadData()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setDeletingCategory(null)
    }
  }

  const handleEditCategory = (category: BudgetCategories) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleCloseCategoryForm = (open: boolean) => {
    setShowCategoryForm(open)
    if (!open) {
      setEditingCategory(null)
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

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('budget_categories')}</CardTitle>
              <CardDescription>
                Manage categories for your budget
              </CardDescription>
            </div>
            {isOwner && (
              <Button onClick={() => setShowCategoryForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('budget_add_category')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.$id} className="card-sleek">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center transition-colors"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <span style={{ color: category.color || '#9B87F5' }}>
                          <CategoryIcon name={category.icon} className="h-5 w-5" />
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        {category.isDefault && (
                          <span className="text-xs text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </DropdownMenuItem>
                          {!category.isDefault && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingCategory(category)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('delete')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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



      {/* Category Form */}
      <CategoryForm
        open={showCategoryForm}
        onOpenChange={handleCloseCategoryForm}
        editingCategory={editingCategory}
        onSuccess={loadData}
      />

      {/* Delete Category Confirmation */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This
              will also delete all associated budgets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Dialog */}
      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={loadData}
      />
    </div>
  )
}
