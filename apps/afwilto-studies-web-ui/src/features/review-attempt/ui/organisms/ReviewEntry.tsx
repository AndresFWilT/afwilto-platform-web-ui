import { Link } from 'react-router-dom'
import { itemView, type ReviewItem } from '@/exams/domain'
import { QuestionView } from '@/shared/ui/organisms/QuestionView'

const noop = () => {}

interface Props {
  item: ReviewItem
  resolveMediaUrl: (sha256: string) => string | null
}

/** One question of the review in reveal mode, with its flag, its skipped state and a link to its note. */
export function ReviewEntry({ item, resolveMediaUrl }: Props) {
  const { reveal } = item
  return (
    <article aria-label={`Question ${item.position + 1}`} className="flex flex-col gap-3 rounded-lg border border-surface-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-neutral-100">{`Question ${item.position + 1}`}</span>
        <span className="flex flex-wrap items-center gap-3">
          {item.flagged && (
            <span className="text-amber-300">
              <span aria-hidden="true">⚑</span> Flagged
            </span>
          )}
          {item.selected.length === 0 && <span className="text-neutral-400">Unanswered</span>}
          {item.noteId && (
            <Link to={`/studies/notes/${item.noteId}`} className="text-primary-300 hover:text-primary-200">View note</Link>
          )}
        </span>
      </div>
      <QuestionView
        question={itemView({ type: item.type, stem: item.stem, options: item.options, chooseCount: reveal.correctLabels.length })}
        selected={item.selected}
        onToggle={noop}
        disabled
        reveal={{ correctLabels: reveal.correctLabels, rationales: reveal.rationales, explanation: reveal.explanation }}
        resolveMediaUrl={resolveMediaUrl}
      />
    </article>
  )
}
