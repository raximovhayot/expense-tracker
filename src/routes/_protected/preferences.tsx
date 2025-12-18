import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
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
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { useAuth } from '@/hooks/use-auth'
import {
  getPreferencesFn,
  updatePreferencesFn,
} from '@/server/functions/preferences'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, User, Bell, Globe } from 'lucide-react'
import { useTheme } from 'next-themes'

export const Route = createFileRoute('/_protected/preferences')({
  component: PreferencesPage,
})

const formSchema = z.object({
  defaultWorkspaceId: z.string().nullable(),
  defaultLanguage: z.enum(['en', 'uz']).nullable(),
  defaultCurrency: z.enum(['USD', 'UZS']).nullable(),
  theme: z.enum(['light', 'dark', 'system']).nullable(),
  notificationsEnabled: z.boolean(),
  emailNotifications: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

function PreferencesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { workspaces } = useWorkspace()
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const { setTheme } = useTheme()

  const fetchPreferences = useServerFn(getPreferencesFn)
  const updatePreferences = useServerFn(updatePreferencesFn)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultWorkspaceId: null,
      defaultLanguage: 'en',
      defaultCurrency: 'USD',
      theme: 'system',
      notificationsEnabled: true,
      emailNotifications: true,
    },
  })

  useEffect(() => {
    async function loadPreferences() {
      setLoading(true)
      try {
        const result = await fetchPreferences()
        form.reset({
          defaultWorkspaceId: result.preferences.defaultWorkspaceId,
          defaultLanguage: result.preferences
            .defaultLanguage as FormValues['defaultLanguage'],
          defaultCurrency: result.preferences
            .defaultCurrency as FormValues['defaultCurrency'],
          theme: result.preferences.theme as FormValues['theme'],
          notificationsEnabled: result.preferences.notificationsEnabled,
          emailNotifications: result.preferences.emailNotifications,
        })
      } catch (error) {
        console.error('Failed to load preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      await updatePreferences({
        data: {
          defaultWorkspaceId: values.defaultWorkspaceId,
          defaultLanguage: values.defaultLanguage,
          defaultCurrency: values.defaultCurrency,
          theme: values.theme,
          notificationsEnabled: values.notificationsEnabled,
          emailNotifications: values.emailNotifications,
        },
      })

      // Apply theme change
      if (values.theme) {
        setTheme(values.theme)
      }

      toast.success(t('preferences_saved'))
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('error_generic')
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t('preferences_title')}</h1>
        <p className="text-muted-foreground mt-1">
          Customize your BudgetFlow experience
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Account</CardTitle>
              </div>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Defaults */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Defaults</CardTitle>
              </div>
              <CardDescription>
                Set your default preferences for new sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="defaultWorkspaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('preferences_default_workspace')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select workspace" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workspaces.map((ws) => (
                          <SelectItem key={ws.$id} value={ws.$id}>
                            {ws.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('preferences_default_language')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
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

                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('preferences_default_currency')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
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
              </div>

              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('preferences_theme')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">
                          {t('preferences_theme_light')}
                        </SelectItem>
                        <SelectItem value="dark">
                          {t('preferences_theme_dark')}
                        </SelectItem>
                        <SelectItem value="system">
                          {t('preferences_theme_system')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('preferences_notifications')}</CardTitle>
              </div>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Push Notifications</FormLabel>
                      <FormDescription>
                        Receive notifications about budget alerts and due
                        expenses
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>
                        {t('preferences_email_notifications')}
                      </FormLabel>
                      <FormDescription>
                        Receive weekly summaries and important updates via email
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save')}
          </Button>
        </form>
      </Form>
    </div>
  )
}
