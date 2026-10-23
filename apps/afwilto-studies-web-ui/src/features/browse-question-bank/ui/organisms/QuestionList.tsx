import type { QuestionSummary } from '@/exams/domain'
import { DIFFICULTY_LABEL } from './BankFilters'

interface Props {
  questions: QuestionSummary[]
  openId: string | null
  onOpen: (id: string) => void
}

export function QuestionList({ questions, openId, onOpen }: Props) {
  return (
    <ul aria-label="Preguntas" className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
      {questions.map((q) => (
        <li key={q.id}>
          <button
            type="button"
            aria-pressed={q.id === openId}
            onClick={() => onOpen(q.id)}
            className={`flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-brand-800 ${q.id === openId ? 'bg-brand-800' : ''}`}
          >
            <span className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <code>{q.key}</code>
              {q.difficulty && <span>{DIFFICULTY_LABEL[q.difficulty]}</span>}
              {q.origin?.set && <span>{q.origin.number ? `${q.origin.set} · n.º ${q.origin.number}` : q.origin.set}</span>}
            </span>
            <span className="text-sm text-neutral-100">{q.stemExcerpt}</span>
            {q.categories.length > 0 && (
              <span className="flex flex-wrap gap-2 text-xs text-neutral-400">
                {q.categories.map((c) => <span key={`${c.classification}/${c.name}`}>{c.classification}: {c.name}</span>)}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
