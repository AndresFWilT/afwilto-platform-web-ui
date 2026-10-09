import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, Text } from '@afwilto/design-system'
import type { Category, Subject } from '@/application/ports'
import { compareByName } from '@/domain/categoryTree'
import { useLibrary } from '@/hooks'
import { CategoryBreadcrumb } from '../shared/CategoryBreadcrumb'
import { ColorChip } from '../shared/chips'
import { LoadError, LoadingRows } from '../shared/states'
import { SubjectFormDialog } from '../Subject/SubjectFormDialog'
import { CategoryActionButtons, useCategoryActions, type CategoryActions } from '../Categories/useCategoryActions'

/**
 * `/studies/categories/:categoryId` (Slice 09a-2): one level of the tree, with a
 * breadcrumb to climb, its subcategories and subjects, and its actions.
 * The previous data stays on screen while it refetches, and the dialogs keep
 * one fixed slot, so an open dialog is never remounted (review F2).
 */
export function CategoryPage() {
  const { categoryId = '' } = useParams()
  const navigate = useNavigate()
  const { state, data, reload } = useLibrary()
  const [creatingSubjectIn, setCreatingSubjectIn] = useState<string | null>(null)
  const actions = useCategoryActions({
    categories: data?.categories ?? [],
    onChanged: reload,
    onDeleted: (deleted) => {
      reload() // the parent view must not list the deleted child (review F1)
      navigate(deleted.parentId ? `/studies/categories/${deleted.parentId}` : '/studies')
    },
  })

  const category = data?.categories.find((c) => c.id.toLowerCase() === categoryId.toLowerCase())

  let content
  if (state.status === 'error') content = <LoadError error={state.error} />
  else if (!data) content = <LoadingRows />
  else if (!category) content = <EmptyState icon="🔎" title="Category not found" description="It may have been deleted." />
  else
    content = (
      <CategoryView
        category={category}
        categories={data.categories}
        subjects={data.subjects}
        actions={actions}
        onNewSubject={() => setCreatingSubjectIn(category.id)}
      />
    )

  return (
    <div className="flex flex-col gap-6">
      {content}
      {actions.dialogs}
      {creatingSubjectIn && (
        <SubjectFormDialog
          defaultCategoryId={creatingSubjectIn}
          onClose={() => setCreatingSubjectIn(null)}
          onSaved={(subject) => {
            setCreatingSubjectIn(null)
            if (subject) navigate(`/studies/subjects/${subject.id}`)
          }}
        />
      )}
    </div>
  )
}

function CategoryView({
  category,
  categories,
  subjects,
  actions,
  onNewSubject,
}: {
  category: Category
  categories: Category[]
  subjects: Subject[]
  actions: CategoryActions
  onNewSubject: () => void
}) {
  const children = categories.filter((c) => c.parentId === category.id).sort(compareByName)
  const ownSubjects = subjects.filter((s) => s.categoryId === category.id).sort(compareByName)

  return (
    <>
      <header className="flex flex-col gap-3">
        <CategoryBreadcrumb categories={categories} categoryId={category.id} currentIsPage />
        <div className="flex flex-wrap items-center gap-3">
          <ColorChip id={category.id} color={category.color} />
          <Text variant="h1" color="default">{category.name}</Text>
          <span className="ml-auto flex flex-wrap gap-1">
            <Button size="sm" onClick={onNewSubject}>New subject</Button>
            <CategoryActionButtons category={category} actions={actions} />
          </span>
        </div>
      </header>

      {children.length === 0 && ownSubjects.length === 0 && (
        <EmptyState icon="🗂️" title="No subcategories or subjects yet" />
      )}
      {children.length > 0 && (
        <section className="flex flex-col gap-2">
          <Text variant="h3" color="default">Subcategories</Text>
          <ul aria-label="Subcategories" className="flex flex-col gap-1">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/studies/categories/${c.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-raised hover:text-primary-300"
                >
                  <ColorChip id={c.id} color={c.color} />
                  <span className="font-medium text-neutral-100">{c.name}</span>
                  <span className="text-xs text-neutral-500">
                    {c.subjectCount} {c.subjectCount === 1 ? 'subject' : 'subjects'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {ownSubjects.length > 0 && (
        <section className="flex flex-col gap-2">
          <Text variant="h3" color="default">Subjects</Text>
          <ul aria-label="Subjects" className="flex flex-col gap-1">
            {ownSubjects.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/studies/subjects/${s.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-300 hover:bg-surface-raised hover:text-primary-300"
                >
                  <span aria-hidden>📘</span>
                  <span>{s.name}</span>
                  <span className="text-xs text-neutral-500">
                    {s.noteCount} {s.noteCount === 1 ? 'note' : 'notes'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
