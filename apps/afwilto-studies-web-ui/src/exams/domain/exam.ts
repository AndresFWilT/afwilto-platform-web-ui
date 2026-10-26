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

export function primaryClassification(exam: Exam): Classification | undefined {
  return exam.classifications.find((c) => c.position === 0)
}

/** Alive questions with no category in the primary classification ("unclassified"). */
export function unclassifiedCount(exam: Exam): number {
  const primary = primaryClassification(exam)
  if (!primary) return exam.questionTotal
  const classified = primary.categories.reduce((sum, c) => sum + c.questionCount, 0)
  return Math.max(0, exam.questionTotal - classified)
}

/** The exam's own pace in minutes per question (FR-3.5). */
export function examPaceMinutes(exam: Pick<ExamSummary, 'timeLimitMin' | 'questionCount'>): number {
  return exam.timeLimitMin / exam.questionCount
}

/** The sum of the weights in the draft, ignoring blanks (they count as 0). */
export function weightsSum(percents: Array<number | null>): number {
  return percents.reduce<number>((sum, p) => sum + (p ?? 0), 0)
}

/** Largest-remainder apportionment of 100 over `counts` (FR-3.4). All zero counts give all zero. */
export function inferWeights(counts: number[]): number[] {
  return apportion(100, counts)
}

/** Largest-remainder apportionment of `total` over `weights` (FR-9): the parts sum to `total`; all-zero weights give all zeros. */
export function apportion(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum === 0) return weights.map(() => 0)
  const raw = weights.map((w) => (w * total) / sum)
  const parts = raw.map(Math.floor)
  let remaining = total - parts.reduce((a, b) => a + b, 0)
  const order = raw
    .map((r, i) => ({ i, frac: r - parts[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (const { i } of order) {
    if (remaining <= 0) break
    parts[i] += 1
    remaining -= 1
  }
  return parts
}
