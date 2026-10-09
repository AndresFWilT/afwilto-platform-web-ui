import { useMemo } from 'react'
import { Button, EmptyState, Text } from '@afwilto/design-system'
import type { Category } from '@/application/ports'
import { buildCategoryTree, type CategoryTreeNode } from '@/domain/categoryTree'
import { useServices } from '@/di'
import { useReloadable } from '@/hooks/useReloadable'
import { ColorChip } from '../shared/chips'
import { LoadError, LoadingRows } from '../shared/states'
import { CategoryActionButtons, useCategoryActions, type CategoryActions } from './useCategoryActions'

/** Manage the category tree: create, edit (rename, recolor, move) and delete (AC-F11, AC-F13). */
export function CategoriesPage() {
  const { studiesService } = useServices()
  const { state, data, reload } = useReloadable(() => studiesService.listCategories(), [studiesService])
  const actions = useCategoryActions({ categories: data ?? [], onChanged: reload })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Text variant="h1" color="default">Categories</Text>
          <Text variant="body" color="muted">Build the tree that holds your subjects (up to 5 levels).</Text>
        </div>
        <Button onClick={() => actions.create(null)}>New root category</Button>
      </div>

      {state.status === 'error' && <LoadError error={state.error} />}
      {state.status !== 'error' && (data ? <Tree categories={data} actions={actions} /> : <LoadingRows />)}
      {actions.dialogs}
    </div>
  )
}

function Tree({ categories, actions }: { categories: Category[]; actions: CategoryActions }) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories])
  if (tree.length === 0) return <EmptyState icon="🗂️" title="No categories yet" description="Create a root category to start." />
  return (
    <ul aria-label="Categories" className="flex flex-col gap-1">
      {tree.map((node) => (
        <Node key={node.id} node={node} actions={actions} />
      ))}
    </ul>
  )
}

function Node({ node, actions }: { node: CategoryTreeNode; actions: CategoryActions }) {
  const { children, ...category } = node
  return (
    <li className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-raised">
        <ColorChip id={node.id} color={node.color} />
        <span className="font-medium text-neutral-100">{node.name}</span>
        <span className="text-xs text-neutral-500">
          {node.subjectCount} {node.subjectCount === 1 ? 'subject' : 'subjects'}
        </span>
        <CategoryActionButtons category={category} actions={actions} />
      </div>
      {children.length > 0 && (
        <ul className="ml-5 flex flex-col gap-1 border-l border-surface-border pl-3">
          {children.map((child) => (
            <Node key={child.id} node={child} actions={actions} />
          ))}
        </ul>
      )}
    </li>
  )
}
