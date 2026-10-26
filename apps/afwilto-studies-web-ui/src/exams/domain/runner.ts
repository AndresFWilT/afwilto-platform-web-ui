// Rules of the runner (Spec 18 FR-9, FR-10, FR-11 navigator, slice 09): pure functions over attempt items.
import type { AnswerInput, AttemptItem, FeedbackMode } from './attempt'
import type { ViewQuestion } from './types'

export type CellState = 'blank' | 'answered' | 'flagged' | 'answered-flagged'

export function cellState(item: Pick<AttemptItem, 'answered' | 'flagged'>): CellState {
  if (item.answered) return item.flagged ? 'answered-flagged' : 'answered'
  return item.flagged ? 'flagged' : 'blank'
}

/** "Question 7, answered, flagged" (position is 0-based; the label is 1-based). */
export function cellLabel(item: Pick<AttemptItem, 'position' | 'answered' | 'flagged'>): string {
  return [`Question ${item.position + 1}`, item.answered ? 'answered' : 'unanswered', ...(item.flagged ? ['flagged'] : [])].join(', ')
}

/** Items with no answer. */
export function unansweredCount(items: Array<Pick<AttemptItem, 'answered'>>): number {
  return items.filter((i) => !i.answered).length
}

/** `m:ss`, or `h:mm:ss` from one hour on. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** What `QuestionView` draws for an item of the runner. */
export function itemView(item: Pick<AttemptItem, 'type' | 'stem' | 'options' | 'chooseCount'>): ViewQuestion {
  return { type: item.type, stem: item.stem, chooseCount: item.type === 'multi' ? (item.chooseCount ?? 1) : 1, options: item.options }
}

/**
 * The body of the PUT after the taker changed `item`. Under feedback `each` the server reveals
 * (and locks) on the first non-empty selection, so a `multi` selection is only sent once it holds
 * N labels; until then the PUT carries the last saved selection.
 */
export function answerPayload(
  item: Pick<AttemptItem, 'type' | 'chooseCount' | 'selected' | 'flagged'>,
  saved: string[],
  feedback: FeedbackMode
): AnswerInput {
  const partial = feedback === 'each' && item.type === 'multi' && item.selected.length < (item.chooseCount ?? 1)
  return { selected: partial ? saved : item.selected, flagged: item.flagged }
}
