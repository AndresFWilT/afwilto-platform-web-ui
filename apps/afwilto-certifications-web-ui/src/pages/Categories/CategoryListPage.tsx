import { useEffect, useState } from 'react'
import { Alert, Button, Dialog, EmptyState, Skeleton, Table, Text, useToast } from '@afwilto/design-system'
import type { TableColumn } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { Category } from '@/application/ports'
import { ColorField, isValidHexColor } from './ColorField'

interface EditCategoryDialogProps {
  category: Category
  onClose: () => void
  onSaved: (updated: Category) => void
}

function EditCategoryDialog({ category, onClose, onSaved }: EditCategoryDialogProps) {
  const { certificationJourneyService } = useServices()
  const { showToast } = useToast()
  const [path, setPath] = useState(category.path)
  const [color, setColor] = useState(category.color)
  const [errors, setErrors] = useState<{ path?: string; color?: string }>({})
  const [saving, setSaving] = useState(false)

  function validate(): boolean {
    const errs: { path?: string; color?: string } = {}
    if (!path.trim()) errs.path = 'Path is required'
    if (!isValidHexColor(color)) errs.color = 'Color must be a 6-digit hex value like #22D3EE'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const updated = await certificationJourneyService.updateCategory(category.id, {
        path: path.trim(),
        color: color.toUpperCase(),
      })
      showToast('Category updated', 'success')
      onSaved(updated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update category'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit "${category.path}"`}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-category-path" className="text-sm font-medium text-neutral-100">
            Path
          </label>
          <input
            id="edit-category-path"
            aria-label="Path"
            className={`w-full border bg-brand-800 text-neutral-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.path ? 'border-red-500' : 'border-surface-border'}`}
            value={path}
            onChange={e => setPath(e.target.value)}
          />
          {errors.path && (
            <p role="alert" className="text-xs text-red-400">
              {errors.path}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-category-color" className="text-sm font-medium text-neutral-100">
            Color
          </label>
          <ColorField id="edit-category-color" value={color} onChange={setColor} error={Boolean(errors.color)} />
          {errors.color && (
            <p role="alert" className="text-xs text-red-400">
              {errors.color}
            </p>
          )}
        </div>
      </div>
    </Dialog>
  )
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function CategoryListPage() {
  const { certificationJourneyService } = useServices()
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  function reload() {
    setLoading(true)
    certificationJourneyService
      .listCategories()
      .then(cats => {
        setCategories(cats)
        setError(null)
      })
      .catch(e => setError(e instanceof Error ? e : new Error('Failed to load categories')))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  async function handleDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await certificationJourneyService.deleteCategory(deleting.id)
      showToast('Category deleted', 'success')
      setCategories(cats => cats.filter(c => c.id !== deleting.id))
      setDeleting(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category'
      showToast(msg, 'error')
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  const columns: TableColumn<Category>[] = [
    {
      key: 'color',
      header: 'Color',
      render: c => (
        <span
          role="img"
          aria-label={`Color ${c.color}`}
          className="inline-block w-4 h-4 rounded-sm"
          style={{ backgroundColor: c.color }}
        />
      ),
    },
    { key: 'path', header: 'Path' },
    {
      key: 'count',
      header: 'In use',
      render: c => (
        <Text as="span" variant="small" color="muted">
          {c.count}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      hideOnMobile: false,
      render: c => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleting(c)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6">
      <Text as="h1" variant="h2">
        Categories
      </Text>

      {error && (
        <Alert variant="error" title="Failed to load categories">
          {error.message}
        </Alert>
      )}

      {loading && !error && <SkeletonRows />}

      {!loading && !error && categories.length === 0 && (
        <EmptyState
          title="No categories yet"
          description="Categories are created from the certification form's “＋ Add new category” option."
        />
      )}

      {!loading && !error && categories.length > 0 && (
        <Table columns={columns} rows={categories} rowKey={c => c.id} label="Categories list" />
      )}

      {editing && (
        <EditCategoryDialog
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={updated => {
            setCategories(cats => cats.map(c => (c.id === updated.id ? updated : c)))
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <Dialog
          open
          onClose={() => setDeleting(null)}
          title={`Delete "${deleting.path}"`}
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDeleting(null)} disabled={deleteBusy}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={deleteBusy} onClick={handleDelete}>
                Delete
              </Button>
            </div>
          }
        >
          <Text variant="body" color="muted">
            This category will be permanently removed. This action cannot be undone.
          </Text>
        </Dialog>
      )}
    </div>
  )
}
