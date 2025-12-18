import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Button } from '@/components/ui/button'
import { IncomeList } from '@/components/income/income-list'
import { IncomeForm } from '@/components/income/income-form'
import { useWorkspace } from '@/hooks/use-workspace'
import { useI18n } from '@/hooks/use-i18n'
import { listIncomeSourcesFn } from '@/server/functions/income'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import type { IncomeSources } from '@/server/lib/appwrite.types'

export const Route = createFileRoute('/_protected/income')({
  component: IncomePage,
})

function IncomePage() {
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState<IncomeSources[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingSource, setEditingSource] = useState<IncomeSources | null>(null)

  const { workspace, canEdit } = useWorkspace()
  const { t } = useI18n()

  const fetchSources = useServerFn(listIncomeSourcesFn)

  const loadData = async () => {
    if (!workspace) return

    setLoading(true)
    try {
      const result = await fetchSources({
        data: { workspaceId: workspace.$id },
      })
      setSources(result.sources)
    } catch (error) {
      console.error('Failed to load income sources:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [workspace])

  const handleEdit = (source: IncomeSources) => {
    setEditingSource(source)
    setShowForm(true)
  }

  const handleCloseForm = (open: boolean) => {
    setShowForm(open)
    if (!open) {
      setEditingSource(null)
    }
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          Select a workspace to manage income
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-24" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('income_title')}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your income sources and track earnings
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('income_add')}
          </Button>
        )}
      </div>

      {/* Income List */}
      <IncomeList sources={sources} onEdit={handleEdit} onUpdate={loadData} />

      {/* Form Dialog */}
      <IncomeForm
        open={showForm}
        onOpenChange={handleCloseForm}
        editingSource={editingSource}
        onSuccess={loadData}
      />
    </div>
  )
}
