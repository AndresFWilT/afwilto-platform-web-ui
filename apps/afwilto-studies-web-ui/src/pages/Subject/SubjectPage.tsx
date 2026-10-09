import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, Text, useToast } from '@afwilto/design-system'
import type { NoteSummary } from '@/application/ports'
import { useServices } from '@/di'
import { useCategories, useSubject, useSubjectNotes } from '@/hooks'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { CategoryBreadcrumb } from '../shared/CategoryBreadcrumb'
import { DeleteDialog } from '../shared/DeleteDialog'
import { SubjectFormDialog } from './SubjectFormDialog'
import { SortSelect, useSortParam } from '../shared/SortSelect'
import { ColorChip, DateText, KindBadge, TagList } from '../shared/chips'
import { LoadError, LoadingRows } from '../shared/states'

export function SubjectPage() {
  const { subjectId = '' } = useParams()
  const [sort, setSort] = useSortParam()
  const [reload, setReload] = useState(0)
  const subject = useSubject(subjectId, reload)
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [modal, setModal] = useState<'edit' | 'delete' | null>(null)
  // A delete that finds the subject already gone keeps its dialog (no refetch,
  // which would unmount it); closing then leaves for the library.
  const [subjectGone, setSubjectGone] = useState(false)
  const notes = useSubjectNotes(subjectId, sort)
  // Ancestors for the breadcrumb, refetched whenever the subject's category changes,
  // so a move into a category created after this page loaded still resolves (F4).
  const categories = useCategories(subject.status === 'success' && subject.data ? subject.data.category.id : '')

  if (subject.status === 'loading') return <LoadingRows />
  if (subject.status === 'error') return <LoadError error={subject.error} />
  if (subject.data === null) return <EmptyState icon="🔎" title="Subject not found" description="It may have been deleted." />

  const s = subject.data
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <ColorChip id={s.category.id} color={s.category.color} />
          {categories.status === 'success' ? (
            <CategoryBreadcrumb categories={categories.data} categoryId={s.category.id} fallbackPath={s.category.path} />
          ) : (
            <span>{s.category.path}</span>
          )}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Text variant="h1" color="default">{s.name}</Text>
          <span className="flex gap-1">
            <Link
              to={`/studies/subjects/${s.id}/notes/new`}
              className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-400"
            >
              New note
            </Link>
            <Button size="sm" variant="ghost" onClick={() => setModal('edit')}>Edit subject</Button>
            <Button size="sm" variant="ghost" onClick={() => setModal('delete')}>Delete subject</Button>
          </span>
        </div>
        {s.description !== null && <Text variant="body" color="muted">{s.description}</Text>}
      </header>

      {modal === 'edit' && (
        <SubjectFormDialog
          subject={s}
          onClose={() => setModal(null)}
          onSaved={(updated) => {
            setModal(null)
            if (!updated) return
            showToast('Subject updated', 'success')
            setReload((n) => n + 1)
          }}
        />
      )}
      {modal === 'delete' && (
        <DeleteDialog
          entity="subject"
          name={s.name}
          inUseText="Move or delete its notes first."
          onConfirm={() => studiesService.deleteSubject(s.id)}
          onDeleted={() => {
            setModal(null)
            showToast('Subject deleted', 'success')
            navigate('/studies')
          }}
          onGone={() => setSubjectGone(true)}
          onClose={() => (subjectGone ? navigate('/studies') : setModal(null))}
        />
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Text variant="h3" color="default">Notes</Text>
          <SortSelect value={sort} onChange={setSort} />
        </div>
        {notes.status === 'loading' && <LoadingRows />}
        {notes.status === 'error' && <LoadError error={notes.error} />}
        {notes.status === 'success' &&
          (notes.data === null ? (
            <EmptyState icon="🔎" title="Subject not found" description="It may have been deleted." />
          ) : notes.data.length === 0 ? (
            <EmptyState icon="📝" title="No notes yet" />
          ) : (
            <NoteList notes={notes.data} />
          ))}
      </section>
    </div>
  )
}

function NoteList({ notes }: { notes: NoteSummary[] }) {
  // Direction chosen in JS: `flex-col sm:flex-row` loses to the shell's Tailwind build.
  const wide = useMediaQuery('(min-width: 640px)', true)
  return (
    <ul aria-label="Notes" className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
      {notes.map((n) => (
        <li key={n.id} className="flex gap-2 px-4 py-3 sm:items-center sm:justify-between" style={{ flexDirection: wide ? 'row' : 'column' }}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Link to={`/studies/notes/${n.id}`} className="font-medium text-neutral-100 hover:text-primary-300">
                {n.title}
              </Link>
              <KindBadge name={n.kind.name} />
            </div>
            <TagList tags={n.tags} />
          </div>
          <span className="text-xs text-neutral-500">
            Updated <DateText iso={n.updatedAt} />
          </span>
        </li>
      ))}
    </ul>
  )
}
