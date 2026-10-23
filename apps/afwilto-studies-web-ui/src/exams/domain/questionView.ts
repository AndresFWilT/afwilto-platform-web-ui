import type { ExamQuestion, RevealInfo, ViewQuestion } from './types'

/** What `QuestionView` draws: the question without its answer key. */
export function toViewQuestion(_q: ExamQuestion): ViewQuestion {
  throw new Error('not implemented')
}

/** The answer key, rationales and explanation for the reveal mode. */
export function toRevealInfo(_q: ExamQuestion): RevealInfo {
  throw new Error('not implemented')
}
