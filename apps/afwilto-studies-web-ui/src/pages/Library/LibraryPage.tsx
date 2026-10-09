import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, EmptyState, Text } from '@afwilto/design-system'
import type { Subject } from '@/application/ports'
import { buildCategoryTree, compareByName, type CategoryTreeNode } from '@/domain/categoryTree'
import { useLibrary } from '@/hooks'
import { ColorChip } from '../shared/chips'
import { LoadError, LoadingRows } from '../shared/states'
import { SubjectFormDialog } from '../Subject/SubjectFormDialog'

export function LibraryPage() {
  const state = useLibrary()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const hasCategories = state.status === 'success' && state.data.categories.length > 0
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Text variant="h1" color="default">Studies</Text>
          <Text variant="body" color="muted">Categories, subjects and notes.</Text>
        </div>
        {hasCategories && <Button onClick={() => setCreating(true)}>New subject</Button>}
      </div>
      {creating && (
        <SubjectFormDialog
          onClose={() => setCreating(false)}
          onSaved={(subject) => {
            setCreating(false)
            if (subject) navigate(`/studies/subjects/${subject.id}`)
          }}
        />
      )}
      {state.status === 'loading' && <LoadingRows />}
      {state.status === 'error' && <LoadError error={state.error} />}
      {state.status === 'success' && <Library categories={state.data.categories} subjects={state.data.subjects} />}
    </div>
  )
}

function Library({ categories, subjects }: { categories: Parameters<typeof buildCategoryTree>[0]; subjects: Subject[] }) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories])
  const subjectsByCategory = useMemo(() => {
    const groups = new Map<string, Subject[]>()
    for (const s of subjects) groups.set(s.categoryId, [...(groups.get(s.categoryId) ?? []), s])
    for (const group of groups.values()) group.sort(compareByName)
    return groups
  }, [subjects])

  if (tree.length === 0) {
    return (
      <EmptyState
        icon="📚"
        title="No categories yet"
        description="Categories you create will appear here as a tree."
        action={
          <Link to="/studies/categories" className="text-sm font-medium text-primary-300 hover:text-primary-200">
            Create a category
          </Link>
        }
      />
    )
  }
  return (
    <ul role="tree" aria-label="Library" className="flex flex-col gap-1">
      {tree.map((node) => (
        <CategoryNode key={node.id} node={node} subjectsByCategory={subjectsByCategory} />
      ))}
    </ul>
  )
}

function CategoryNode({ node, subjectsByCategory }: { node: CategoryTreeNode; subjectsByCategory: Map<string, Subject[]> }) {
  const [expanded, setExpanded] = useState(true) // D-3: every node starts expanded
  const subjects = subjectsByCategory.get(node.id) ?? []
  const hasContent = node.children.length > 0 || subjects.length > 0

  return (
    <li role="treeitem" aria-expanded={hasContent ? expanded : undefined} className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-raised">
        {hasContent ? (
          <button
            type="button"
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.name}`}
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
            className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-400"
          >
            <span aria-hidden>{expanded ? '▾' : '▸'}</span>
          </button>
        ) : (
          <span aria-hidden className="h-5 w-5" />
        )}
        <ColorChip id={node.id} color={node.color} />
        <span className="font-medium text-neutral-100">{node.name}</span>
        <span className="text-xs text-neutral-500">
          {node.subjectCount} {node.subjectCount === 1 ? 'subject' : 'subjects'}
        </span>
      </div>
      {hasContent && expanded && (
        <ul role="group" className="ml-5 flex flex-col gap-1 border-l border-surface-border pl-3">
          {subjects.map((s) => (
            <li key={s.id}>
              <Link
                to={`/studies/subjects/${s.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-neutral-300 hover:bg-surface-raised hover:text-primary-300"
              >
                <span aria-hidden>📘</span>
                <span>{s.name}</span>
                <span className="text-xs text-neutral-500">
                  {s.noteCount} {s.noteCount === 1 ? 'note' : 'notes'}
                </span>
              </Link>
            </li>
          ))}
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} subjectsByCategory={subjectsByCategory} />
          ))}
        </ul>
      )}
    </li>
  )
}
