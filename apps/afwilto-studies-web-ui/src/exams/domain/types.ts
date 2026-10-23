// Domain types of the exams area (Spec 18 §2). Pure data: no React, no I/O.

export type QuestionType = 'single' | 'multi'

/** One option as a question is displayed: the label is assigned by display order (A, B, C…). */
export interface ViewOption {
  label: string
  text?: string
  /** `media:<sha256>` */
  image?: string
  alt?: string
}

/** What `QuestionView` needs to draw a question; it carries no answer key. */
export interface ViewQuestion {
  type: QuestionType
  /** Markdown; images are `media:<sha256>` or https. */
  stem: string
  /** N: how many options a taker picks (1 for `single`, the number of correct options for `multi`). */
  chooseCount: number
  options: ViewOption[]
}

/** What the review adds on top of the question. */
export interface RevealInfo {
  correctLabels: string[]
  rationales: Record<string, string>
  explanation?: string
}

export type QuestionTemplate = 'text-list' | 'media-stem' | 'option-cards'

export interface ExamOption extends ViewOption {
  correct: boolean
  rationale?: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuestionCategoryRef {
  classification: string
  name: string
}

export interface QuestionOrigin {
  set?: string
  number?: number
  noteRef?: string
}

/** A stored question with its answer key (GET /questions/{id}). */
export interface ExamQuestion {
  id: string
  examId: string
  key: string
  type: QuestionType
  stem: string
  explanation?: string
  difficulty?: Difficulty
  origin?: QuestionOrigin
  categories: QuestionCategoryRef[]
  options: ExamOption[]
  version: number
}

export interface CreateExamInput {
  name: string
  questionCount: number
  timeLimitMin: number
  passPercent: number
}
