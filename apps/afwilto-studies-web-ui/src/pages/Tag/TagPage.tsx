import { Link, useParams } from 'react-router-dom'
import { EmptyState, Text } from '@afwilto/design-system'
import type { TaggedNoteSummary } from '@/application/ports'
import { useTagNotes } from '@/hooks'
import { SortSelect, useSortParam } from '../shared/SortSelect'
import { ColorChip, DateText, KindBadge } from '../shared/chips'
import { LoadError, LoadingRows } from '../shared/states'

export function TagPage() {
  const { tag = '' } = useParams()
  const [sort, setSort] = useSortParam()
  const state = useTagNotes(tag, sort)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Text variant="h1" color="default">#{tag}</Text>
          <Text variant="body" color="muted">Notes with this tag, across every subject.</Text>
        </div>
        <SortSelect value={sort} onChange={setSort} />
      </div>
      {state.status === 'loading' && <LoadingRows />}
      {state.status === 'error' && <LoadError error={state.error} />}
      {state.status === 'success' &&
        (state.data.length === 0 ? (
          <EmptyState icon="🏷️" title={`No notes tagged “${tag}”`} />
        ) : (
          <TaggedNoteList notes={state.data} />
        ))}
    </div>
  )
}

function TaggedNoteList({ notes }: { notes: TaggedNoteSummary[] }) {
  return (
    <ul aria-label="Notes" className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
      {notes.map((n) => (
        <li key={n.id} className="flex flex-col gap-1.5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link to={`/studies/notes/${n.id}`} className="font-medium text-neutral-100 hover:text-primary-300">
              {n.title}
            </Link>
            <KindBadge name={n.kind.name} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <ColorChip id={n.category.id} color={n.category.color} />
            <span>{n.category.path}</span>
            <span aria-hidden>·</span>
            <Link to={`/studies/subjects/${n.subject.id}`} className="hover:text-primary-300">
              {n.subject.name}
            </Link>
            <span aria-hidden>·</span>
            <span>
              Updated <DateText iso={n.updatedAt} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
