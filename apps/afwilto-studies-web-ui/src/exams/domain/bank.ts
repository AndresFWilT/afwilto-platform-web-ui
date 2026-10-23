// Question bank, attempt history and the import report, as the UI reads them (Spec 18 FR-4, §6).
import type { Difficulty, ExamQuestion, QuestionCategoryRef, QuestionOrigin, QuestionType } from './types'

export interface QuestionSummary {
  id: string
  key: string
  type: QuestionType
  stemExcerpt: string
  categories: QuestionCategoryRef[]
  difficulty?: Difficulty
  origin?: QuestionOrigin
  version: number
  updatedAt: string
}

/** Filters of the bank browser; they combine with AND. */
export interface QuestionFilter {
  /** A category id. */
  category?: string
  /** An exact `origin.set`. */
  origin?: string
  difficulty?: Difficulty
  /** Case-insensitive substring of the stem. */
  q?: string
  unclassified?: boolean
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired'

export interface AttemptSummary {
  id: string
  selectionKind: 'simulation' | 'random' | 'categories' | 'origin-set'
  timingKind: 'untimed' | 'timed'
  feedback: 'end' | 'each'
  status: AttemptStatus
  startedAt: string
  durationSeconds?: number
  scorePercent?: number
  passed?: boolean
}

export interface AttemptHistory {
  attempts: AttemptSummary[]
  /** Closed simulation attempts only, oldest first (D-11). */
  trend: Array<{ at: string; scorePercent: number }>
}

export interface ImportError {
  path: string
  rule: string
  message: string
}

export interface ImportReport {
  dryRun: boolean
  /** True only when the import was committed. */
  applied: boolean
  counts: { create: number; update: number; unchanged: number; invalid: number }
  keys: { create: string[]; update: string[]; unchanged: string[] }
  errors: ImportError[]
  /** Name of the primary classification; null when none could be resolved. */
  primary: string | null
  newClassifications: Array<{ name: string }>
  newCategories: Array<{ classification: string; name: string; similarTo: string[] }>
  weightsAfter: Array<{ category: string; percent: number; mode: 'inferred' | 'manual' }>
  duplicateStems: Array<{ key: string; existingKey: string }>
  media: { referenced: number; inZip: number; missing: string[]; unused: string[] }
  /** The first 5 questions as they will be stored. */
  preview: ExamQuestion[]
  warnings: string[]
}

export interface ImportOptions {
  dryRun: boolean
  /** The primary classification's name; honoured only on the first import. */
  primary?: string
}
