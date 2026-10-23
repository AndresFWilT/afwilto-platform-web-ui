import type { CreateExamInput } from './types'

/** What the exam form holds: numbers stay text until they are checked. */
export interface ExamFormValues {
  name: string
  questionCount: string
  timeLimitMin: string
  passPercent: string
}

export interface ExamFormCheck {
  /** Messages by field name; empty when the values are valid. */
  errors: Partial<Record<keyof ExamFormValues, string>>
  /** The values parsed and trimmed; present only when there are no errors. */
  value?: CreateExamInput
}

export function validateExamInput(_values: ExamFormValues): ExamFormCheck {
  throw new Error('not implemented')
}
