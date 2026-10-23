// Sessions, attempts and their review as the UI reads them (Spec 18 FR-7..FR-10, §6). Pure data.
import type { QuestionCategoryRef, QuestionType, ViewOption } from './types'

export type FeedbackMode = 'end' | 'each'

export type SessionSelection =
  | { kind: 'simulation' }
  | { kind: 'random'; count: number }
  | { kind: 'categories'; classificationId: string; categoryIds: string[]; count: number | 'all' }
  | { kind: 'origin-set'; set: string }

export type SessionTiming = { kind: 'untimed' } | { kind: 'timed'; minutes: number }

/** What the taker chose. For `simulation`, `timing` and `feedback` are omitted: the server forces them. */
export interface SessionConfig {
  selection: SessionSelection
  timing?: SessionTiming
  feedback?: FeedbackMode
}

/** A category with fewer alive questions than its simulation quota. */
export interface Shortage {
  category: string
  needed: number
  available: number
}

export interface SessionPreview {
  poolSize: number
  drawCount: number
  suggestedMinutes: number
  shortages: Shortage[]
}

/** The answer key of one item, present once it is revealed (feedback `each`) or the attempt is closed. */
export interface AttemptReveal {
  correct: boolean
  correctLabels: string[]
  rationales: Record<string, string>
  explanation?: string
}

export interface AttemptItem {
  position: number
  stem: string
  type: QuestionType
  /** N of a `multi` question; absent on `single`. */
  chooseCount?: number
  options: ViewOption[]
  selected: string[]
  flagged: boolean
  answered: boolean
  /** Only for items revealed under feedback `each`. */
  reveal?: AttemptReveal
}

export type AttemptState = 'in_progress' | 'submitted' | 'expired'

export interface Attempt {
  id: string
  examId: string
  config: SessionConfig
  status: AttemptState
  startedAt: string
  /** Timed attempts only. */
  deadlineAt?: string
  /** Timed attempts only, computed by the server. */
  remainingSeconds?: number
  suggestedMinutes: number
  items: AttemptItem[]
}

export interface AnswerInput {
  selected: string[]
  flagged: boolean
}

export interface AnswerOutcome {
  position: number
  selected: string[]
  flagged: boolean
  /** Present only under feedback `each` for a non-empty selection. */
  reveal?: AttemptReveal
}

export interface CategoryScore {
  name: string
  correct: number
  total: number
  percent: number
}

export interface ClassificationScore {
  classification: string
  /** Weakest first (percent ascending, then name). */
  categories: CategoryScore[]
}

export interface AttemptResult {
  scorePercent: number
  /** Simulation attempts only; null for every other selection. */
  passed: boolean | null
  correctCount: number
  total: number
  durationSeconds: number
  breakdown: ClassificationScore[]
}

export interface ReviewItem {
  position: number
  stem: string
  type: QuestionType
  options: ViewOption[]
  selected: string[]
  flagged: boolean
  reveal: AttemptReveal
  categories: QuestionCategoryRef[]
  /** The alive note of the subject that `origin.noteRef` points to. */
  noteId?: string
}

/** The result page's data: the score, the breakdown and every item with its answer key. */
export interface AttemptReport {
  examId: string
  selectionKind: 'simulation' | 'random' | 'categories' | 'origin-set'
  result: AttemptResult
  review: ReviewItem[]
}

export const feedbackOf = (config: SessionConfig): FeedbackMode => config.feedback ?? 'end'
