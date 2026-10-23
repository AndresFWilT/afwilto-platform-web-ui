// The exam aggregate as the UI reads it (Spec 18 §2, FR-1, FR-3). Pure data and rules.

export interface LastSimulation {
  scorePercent: number
  passed: boolean
  at: string
}

export interface ExamSummary {
  id: string
  subjectId: string
  name: string
  questionCount: number
  timeLimitMin: number
  passPercent: number
  /** Alive questions in the bank. */
  questionTotal: number
  lastSimulation?: LastSimulation
  version: number
  createdAt: string
  updatedAt: string
}

export interface ExamCategory {
  id: string
  key: string
  name: string
  /** Primary classification only; null on the secondary one. */
  weightPercent: number | null
  paceQuestions: number | null
  paceMinutes: number | null
  /** Alive questions linked to the category. */
  questionCount: number
}

export type WeightMode = 'inferred' | 'manual'

export interface Classification {
  id: string
  name: string
  /** 0 is the primary classification. */
  position: 0 | 1
  /** Only meaningful on the primary. */
  weightMode: WeightMode
  categories: ExamCategory[]
}

export interface Exam extends ExamSummary {
  classifications: Classification[]
}

/** The body of PATCH /exams/{id}: every group is applied atomically under `version`. */
export interface UpdateExamInput {
  version: number
  name?: string
  questionCount?: number
  timeLimitMin?: number
  passPercent?: number
  classifications?: Array<{ id: string; name?: string }>
  primaryClassificationId?: string
  weights?: Array<{ categoryId: string; percent: number }>
  weightMode?: 'inferred'
  categories?: Array<{ id: string; name?: string; paceQuestions?: number | null; paceMinutes?: number | null }>
}

export interface MergeCategoriesInput {
  from: string
  into: string
}

const notImplemented = (): never => {
  throw new Error('not implemented')
}

export function primaryClassification(_exam: Exam): Classification | undefined {
  return notImplemented()
}

/** Alive questions with no category in the primary classification ("sin clasificar"). */
export function unclassifiedCount(_exam: Exam): number {
  return notImplemented()
}

/** The exam's own pace in minutes per question (FR-3.5). */
export function examPaceMinutes(_exam: Pick<ExamSummary, 'timeLimitMin' | 'questionCount'>): number {
  return notImplemented()
}

/** The sum of the weights in the draft, ignoring blanks (they count as 0). */
export function weightsSum(_percents: Array<number | null>): number {
  return notImplemented()
}

/** Largest-remainder apportionment of 100 over `counts` (FR-3.4). All zero counts give all zero. */
export function inferWeights(_counts: number[]): number[] {
  return notImplemented()
}
