// Rules of the runner (Spec 18 FR-9, FR-10, FR-11 navigator, slice 09): pure functions over attempt items.
import type { AnswerInput, AttemptItem, FeedbackMode } from './attempt'
import type { ViewQuestion } from './types'

export type CellState = 'blank' | 'answered' | 'flagged' | 'answered-flagged'

export function cellState(_item: Pick<AttemptItem, 'answered' | 'flagged'>): CellState {
  throw new Error('not implemented')
}

/** "Pregunta 7, respondida, marcada" (position is 0-based; the label is 1-based). */
export function cellLabel(_item: Pick<AttemptItem, 'position' | 'answered' | 'flagged'>): string {
  throw new Error('not implemented')
}

/** Items with no answer. */
export function unansweredCount(_items: Array<Pick<AttemptItem, 'answered'>>): number {
  throw new Error('not implemented')
}

/** `m:ss`, or `h:mm:ss` from one hour on. */
export function formatClock(_seconds: number): string {
  throw new Error('not implemented')
}

/** What `QuestionView` draws for an item of the runner. */
export function itemView(_item: Pick<AttemptItem, 'type' | 'stem' | 'options' | 'chooseCount'>): ViewQuestion {
  throw new Error('not implemented')
}

/**
 * The body of the PUT after the taker changed `item`. Under feedback `each` the server reveals
 * (and locks) on the first non-empty selection, so a `multi` selection is only sent once it holds
 * N labels; until then the PUT carries the last saved selection.
 */
export function answerPayload(
  _item: Pick<AttemptItem, 'type' | 'chooseCount' | 'selected' | 'flagged'>,
  _saved: string[],
  _feedback: FeedbackMode
): AnswerInput {
  throw new Error('not implemented')
}
