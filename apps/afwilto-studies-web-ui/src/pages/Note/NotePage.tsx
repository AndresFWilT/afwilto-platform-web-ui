import { Link, useParams } from 'react-router-dom'
import { EmptyState, Text } from '@afwilto/design-system'
import { useNote } from '@/hooks'
import { DateText, KindBadge, TagList } from '../shared/chips'
import { LoadError, LoadingRows } from '../shared/states'

export function NotePage() {
  const { noteId = '' } = useParams()
  const state = useNote(noteId)

  if (state.status === 'loading') return <LoadingRows />
  if (state.status === 'error') return <LoadError error={state.error} />
  if (state.data === null) return <EmptyState icon="🔎" title="Note not found" description="It may have been deleted." />

  const { note, subject } = state.data
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        {subject && (
          <Link to={`/studies/subjects/${subject.id}`} className="self-start text-sm text-neutral-400 hover:text-primary-300">
            {subject.name}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Text variant="h1" color="default">{note.title}</Text>
          <KindBadge name={note.kind.name} />
        </div>
        <TagList tags={note.tags} />
        <p className="flex gap-4 text-xs text-neutral-500">
          <span>Created <DateText iso={note.createdAt} /></span>
          <span>Updated <DateText iso={note.updatedAt} /></span>
        </p>
      </header>
      {/* D-1: raw Markdown source as text until Slice 08 brings the sanitized renderer. */}
      <pre className="whitespace-pre-wrap break-words rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-sm text-neutral-200">
        {note.content}
      </pre>
    </article>
  )
}
