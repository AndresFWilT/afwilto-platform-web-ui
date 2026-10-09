import { useMemo, useState } from 'react'
import { Button, EmptyState, Text, useToast } from '@afwilto/design-system'
import type { Category } from '@/application/ports'
import { buildCategoryTree, type CategoryTreeNode } from '@/domain/categoryTree'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import { ColorChip } from '../shared/chips'
import { DeleteDialog } from '../shared/DeleteDialog'
import { LoadError, LoadingRows } from '../shared/states'
import { CategoryFormDialog, type CategoryFormMode } from './CategoryFormDialog'

const MAX_DEPTH = 5
const TOAST = { created: 'Category created', updated: 'Category updated' } as const

type Modal = { type: 'form'; mode: CategoryFormMode } | { type: 'delete'; category: Category } | null

/** Manage the category tree: create, edit (rename, recolor, move) and delete (AC-F11, AC-F13). */
export function CategoriesPage() {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const [reload, setReload] = useState(0)
  const state = useAsync(() => studiesService.listCategories(), [studiesService, reload])
  const [modal, setModal] = useState<Modal>(null)
  // Kept across refetches so an open dialog never loses its options.
  const [lastCategories, setLastCategories] = useState<Category[]>([])
  if (state.status === 'success' && state.data !== lastCategories) setLastCategories(state.data)

  const refetch = () => setReload((n) => n + 1)
  const close = () => setModal(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Text variant="h1" color="default">Categories</Text>
          <Text variant="body" color="muted">Build the tree that holds your subjects (up to 5 levels).</Text>
        </div>
        <Button onClick={() => setModal({ type: 'form', mode: { type: 'create', parentId: null } })}>New root category</Button>
      </div>

      {state.status === 'loading' && <LoadingRows />}
      {state.status === 'error' && <LoadError error={state.error} />}
      {state.status === 'success' && <Tree categories={state.data} onAction={setModal} />}

      {modal?.type === 'form' && (
        <CategoryFormDialog
          mode={modal.mode}
          categories={lastCategories}
          onGone={refetch}
          onClose={close}
          onSaved={(outcome) => {
            close()
            if (outcome === 'unchanged') return
            showToast(TOAST[outcome], 'success')
            refetch()
          }}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteDialog
          entity="category"
          name={modal.category.name}
          inUseText="Move or delete its subcategories and subjects first."
          onConfirm={() => studiesService.deleteCategory(modal.category.id)}
          onDeleted={() => {
            close()
            showToast('Category deleted', 'success')
            refetch()
          }}
          onGone={refetch}
          onClose={close}
        />
      )}
    </div>
  )
}

function Tree({ categories, onAction }: { categories: Category[]; onAction: (m: Modal) => void }) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories])
  if (tree.length === 0) return <EmptyState icon="🗂️" title="No categories yet" description="Create a root category to start." />
  return (
    <ul aria-label="Categories" className="flex flex-col gap-1">
      {tree.map((node) => (
        <Node key={node.id} node={node} onAction={onAction} />
      ))}
    </ul>
  )
}

function Node({ node, onAction }: { node: CategoryTreeNode; onAction: (m: Modal) => void }) {
  const { children, ...category } = node
  return (
    <li className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-raised">
        <ColorChip id={node.id} color={node.color} />
        <span className="font-medium text-neutral-100">{node.name}</span>
        <span className="text-xs text-neutral-500">
          {node.subjectCount} {node.subjectCount === 1 ? 'subject' : 'subjects'}
        </span>
        <span className="ml-auto flex gap-1">
          {node.depth < MAX_DEPTH && (
            <Button size="sm" variant="ghost" aria-label={`Add child to ${node.name}`}
              onClick={() => onAction({ type: 'form', mode: { type: 'create', parentId: node.id } })}>
              + Child
            </Button>
          )}
          <Button size="sm" variant="ghost" aria-label={`Edit ${node.name}`}
            onClick={() => onAction({ type: 'form', mode: { type: 'edit', category } })}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" aria-label={`Delete ${node.name}`}
            onClick={() => onAction({ type: 'delete', category })}>
            Delete
          </Button>
        </span>
      </div>
      {children.length > 0 && (
        <ul className="ml-5 flex flex-col gap-1 border-l border-surface-border pl-3">
          {children.map((child) => (
            <Node key={child.id} node={child} onAction={onAction} />
          ))}
        </ul>
      )}
    </li>
  )
}
