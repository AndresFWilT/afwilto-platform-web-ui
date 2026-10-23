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

export const EXAM_RANGES = {
  questionCount: [1, 200],
  timeLimitMin: [1, 600],
  passPercent: [1, 100],
} as const
const RANGES = EXAM_RANGES

/** Limits the server enforces (contract 0.3.0); the client refuses the same values before sending. */
export const EXAM_NAME_MAX = 120
export const CLASSIFICATION_NAME_MAX = 40
export const CATEGORY_NAME_MAX = 80
export const PACE_MAX = 10_000
export const WEIGHT_MAX = 100

/** Checks the form before anything is sent (BR-E2); the server repeats the rules. */
export function validateExamInput(values: ExamFormValues): ExamFormCheck {
  const errors: ExamFormCheck['errors'] = {}
  const name = values.name.trim()
  if (name === '') errors.name = 'El nombre es obligatorio'
  else if (name.length > EXAM_NAME_MAX) errors.name = `El nombre admite hasta ${EXAM_NAME_MAX} caracteres`

  const numbers = {} as Record<keyof typeof RANGES, number>
  for (const field of Object.keys(RANGES) as Array<keyof typeof RANGES>) {
    const [min, max] = RANGES[field]
    const raw = values[field].trim()
    const n = /^\d+$/.test(raw) ? Number(raw) : NaN
    if (n >= min && n <= max) numbers[field] = n
    else errors[field] = `Debe estar entre ${min} y ${max}`
  }
  return Object.keys(errors).length ? { errors } : { errors, value: { name, ...numbers } }
}
