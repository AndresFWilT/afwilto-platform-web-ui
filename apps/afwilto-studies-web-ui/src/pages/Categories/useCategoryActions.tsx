import { useState, type ReactNode } from 'react'
import { Button, useToast } from '@afwilto/design-system'
import type { Category } from '@/application/ports'
import { useServices } from '@/di'
import { DeleteDialog } from '../shared/DeleteDialog'
import { CategoryFormDialog, type CategoryFormMode } from './CategoryFormDialog'

const MAX_DEPTH = 5
const TOAST = { created: 'Category created', updated: 'Category updated' } as const

type Modal = { type: 'form'; mode: CategoryFormMode } | { type: 'delete'; category: Category } | null

export interface CategoryActions {
  create: (parentId: string | null) => void
  edit: (category: Category) => void
  remove: (category: Category) => void
  /** Render once per page: the open dialog, if any. */
  dialogs: ReactNode
}

/**
 * Category create / edit / delete with their dialogs and toasts, shared by the
 * library, the management page and the category view (Slice 09a-2).
 */
export function useCategoryActions({
  categories,
  onChanged,
  onDeleted,
}: {
  /** Every alive category, in path order (feeds the parent picker). */
  categories: Category[]
  /** After a create, update, or a delete that found the category gone: refetch. */
  onChanged: () => void
  /** After a successful delete; defaults to onChanged. */
  onDeleted?: (category: Category) => void
}): CategoryActions {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const [modal, setModal] = useState<Modal>(null)
  const close = () => setModal(null)

  const dialogs =
    modal?.type === 'form' ? (
      <CategoryFormDialog
        mode={modal.mode}
        categories={categories}
        onGone={onChanged}
        onClose={close}
        onSaved={(outcome) => {
          close()
          if (outcome === 'unchanged') return
          showToast(TOAST[outcome], 'success')
          onChanged()
        }}
      />
    ) : modal?.type === 'delete' ? (
      <DeleteDialog
        entity="category"
        name={modal.category.name}
        inUseText="Move or delete its subcategories and subjects first."
        onConfirm={() => studiesService.deleteCategory(modal.category.id)}
        onDeleted={() => {
          const deleted = modal.category
          close()
          showToast('Category deleted', 'success')
          ;(onDeleted ?? onChanged)(deleted)
        }}
        onGone={onChanged}
        onClose={close}
      />
    ) : null

  return {
    create: (parentId) => setModal({ type: 'form', mode: { type: 'create', parentId } }),
    edit: (category) => setModal({ type: 'form', mode: { type: 'edit', category } }),
    remove: (category) => setModal({ type: 'delete', category }),
    dialogs,
  }
}

/** "+ Child" (below depth 5), "Edit" and "Delete", labelled with the category name. */
export function CategoryActionButtons({ category, actions }: { category: Category; actions: CategoryActions }) {
  return (
    <span className="ml-auto flex gap-1">
      {category.depth < MAX_DEPTH && (
        <Button size="sm" variant="ghost" aria-label={`Add child to ${category.name}`} onClick={() => actions.create(category.id)}>
          + Child
        </Button>
      )}
      <Button size="sm" variant="ghost" aria-label={`Edit ${category.name}`} onClick={() => actions.edit(category)}>
        Edit
      </Button>
      <Button size="sm" variant="ghost" aria-label={`Delete ${category.name}`} onClick={() => actions.remove(category)}>
        Delete
      </Button>
    </span>
  )
}
