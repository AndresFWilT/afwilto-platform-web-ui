import type { Exam, UpdateExamInput } from './exam'
import type { ExamFormValues } from './examValidation'

/** What the edit form holds while the user types: everything as text, keyed by id. */
export interface ExamDraft {
  params: ExamFormValues
  /** Classification id → name. */
  classificationNames: Record<string, string>
  /** The classification chosen as primary. */
  primaryId: string | null
  /** Category id → name and pace pair. */
  categories: Record<string, { name: string; paceQuestions: string; paceMinutes: string }>
  /** Primary category id → weight. */
  weights: Record<string, string>
}

export interface DraftCheck {
  /** The edit to send; absent when nothing changed. */
  patch?: UpdateExamInput
  /** Messages by key: a form field (`name`…), `classification:<id>`, `category:<id>`, `pace:<id>` or `weights`. Empty when sendable. */
  problems: Record<string, string>
  /** Sum of the primary weights in the draft (a blank counts as 0). */
  weightsSum: number
}

export function draftFrom(_exam: Exam): ExamDraft {
  throw new Error('not implemented')
}

/** Compares the draft with the exam it was made from and builds the minimal atomic edit. */
export function checkDraft(_exam: Exam, _draft: ExamDraft): DraftCheck {
  throw new Error('not implemented')
}
