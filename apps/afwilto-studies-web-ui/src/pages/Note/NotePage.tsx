import { useId } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, Text } from '@afwilto/design-system'
import type { SlabLink } from '@/application/ports'
import { MarkdownView } from '@/features/markdown/MarkdownView'
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
      <MarkdownView content={note.content} />
      <RelatedInSlab links={note.slabLinks} />
    </article>
  )
}

/** FR-6 / AC-F10: router links into slab, in stored order; absent when empty. */
function RelatedInSlab({ links }: { links: SlabLink[] }) {
  const headingId = useId()
  if (links.length === 0) return null
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 border-t border-surface-border pt-6">
      <h2 id={headingId} className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Related in slab
      </h2>
      <ul className="flex flex-col gap-2">
        {links.map((link, i) => (
          <li key={`${i}-${link.path}`}>
            <Link to={link.path} className="inline-flex items-center gap-2 text-primary-300 hover:text-primary-200">
              <span aria-hidden>🧪</span>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
