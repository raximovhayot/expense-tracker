import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { toast } from 'sonner'
import { createWorkspaceFn } from '@/server/functions/workspaces'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const [loading, setLoading] = useState(false)
  const { addWorkspace, setWorkspace } = useWorkspace()
  const { t } = useI18n()
  const createWorkspace = useServerFn(createWorkspaceFn)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const result = await createWorkspace({
        data: {
          name: values.name,
          description: values.description || null,
        },
      })

      const workspaceWithRole = {
        ...result.workspace,
        userRole: 'owner',
      }

      addWorkspace(workspaceWithRole)
      setWorkspace(workspaceWithRole)
      toast.success(t('workspace_created'))
      form.reset()
      onOpenChange(false)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('workspace_create')}</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your finances. You can invite
            collaborators after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workspace_name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Personal Budget, Business, Family..."
                      {...field}
                    />
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
                      placeholder="Optional description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
