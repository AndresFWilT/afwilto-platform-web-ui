import { Link, useParams } from 'react-router-dom'
import { EmptyState, Text } from '@afwilto/design-system'
import type { NoteSummary } from '@/application/ports'
import { useSubject, useSubjectNotes } from '@/hooks'
import { SortSelect, useSortParam } from '../shared/SortSelect'
import { ColorChip, DateText, KindBadge, TagList } from '../shared/chips'
import { LoadError, LoadingRows } from '../shared/states'

export function SubjectPage() {
  const { subjectId = '' } = useParams()
  const [sort, setSort] = useSortParam()
  const subject = useSubject(subjectId)
  const notes = useSubjectNotes(subjectId, sort)

  if (subject.status === 'loading') return <LoadingRows />
  if (subject.status === 'error') return <LoadError error={subject.error} />
  if (subject.data === null) return <EmptyState icon="🔎" title="Subject not found" description="It may have been deleted." />

  const s = subject.data
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <ColorChip id={s.category.id} color={s.category.color} />
          <span>{s.category.path}</span>
        </div>
        <Text variant="h1" color="default">{s.name}</Text>
        {s.description !== null && <Text variant="body" color="muted">{s.description}</Text>}
      </header>

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
  return (
    <ul aria-label="Notes" className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
      {notes.map((n) => (
        <li key={n.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
