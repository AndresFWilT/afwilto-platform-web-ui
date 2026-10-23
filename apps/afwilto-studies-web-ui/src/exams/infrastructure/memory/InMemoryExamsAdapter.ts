import {
  inferWeights,
  primaryClassification,
  type AttemptHistory,
  type Classification,
  type CreateExamInput,
  type Exam,
  type ExamCategory,
  type ExamQuestion,
  type ExamSummary,
  type ImportOptions,
  type ImportReport,
  type MergeCategoriesInput,
  type QuestionFilter,
  type QuestionSummary,
  type UpdateExamInput,
} from '@/exams/domain'
import {
  ExamsConflictError,
  ExamsNotFoundError,
  ExamsValidationError,
  type ExamsViolation,
  type IExamsService,
} from '@/exams/application/ports'

export interface ExamsSeed {
  exams: Exam[]
  /** sha256 → data URL */
  media: Record<string, string>
  /** The bank. The exams' question counts are derived from it, not read from the exams. */
  questions?: ExamQuestion[]
  /** examId → attempt history. */
  attempts?: Record<string, AttemptHistory>
}

const RANGES = {
  questionCount: [1, 200],
  timeLimitMin: [1, 600],
  passPercent: [1, 100],
} as const

/** Case-, accent- and space-insensitive form of a name (FR-3.1). */
export const fold = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

const clone = <T>(value: T): T => structuredClone(value)
const violation = (field: string, rule: string, message: string): ExamsViolation => ({ field, rule, message })

function rangeViolations(input: Partial<CreateExamInput>): ExamsViolation[] {
  return (Object.keys(RANGES) as Array<keyof typeof RANGES>).flatMap((field) => {
    const value = input[field]
    const [min, max] = RANGES[field]
    return value !== undefined && !(value >= min && value <= max) ? [violation(field, 'range', `must be between ${min} and ${max}`)] : []
  })
}

/** The questions as an update sees them; committed only when the whole update succeeds. */
interface Bank {
  questions: ExamQuestion[]
}

type CategoryRef = ExamQuestion['categories'][number]

/** Rewrites the category links of one exam's questions. */
function relink(bank: Bank, examId: string, map: (ref: CategoryRef) => CategoryRef) {
  bank.questions = bank.questions.map((q) => (q.examId === examId ? { ...q, categories: q.categories.map(map) } : q))
}

export class InMemoryExamsAdapter implements IExamsService {
  private readonly exams: Exam[]
  private readonly media: Record<string, string>
  private questions: ExamQuestion[]
  private readonly attempts: Record<string, AttemptHistory>

  constructor(seed: ExamsSeed) {
    this.exams = clone(seed.exams)
    this.media = { ...seed.media }
    this.questions = clone(seed.questions ?? [])
    this.attempts = clone(seed.attempts ?? {})
  }

  // ── exams ──────────────────────────────────────────────────────────────────

  async createExam(subjectId: string, input: CreateExamInput): Promise<Exam> {
    const violations = rangeViolations(input)
    if (violations.length) throw new ExamsValidationError(violations)
    this.assertNameFree(subjectId, input.name)
    const now = new Date().toISOString()
    const exam: Exam = {
      id: crypto.randomUUID(),
      subjectId,
      ...input,
      name: input.name.trim(),
      questionTotal: 0,
      classifications: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    }
    this.exams.push(exam)
    return this.view(exam)
  }

  async listExams(subjectId: string): Promise<ExamSummary[]> {
    return this.exams
      .filter((e) => e.subjectId === subjectId)
      .map((e) => {
        const { classifications: _classifications, ...summary } = this.view(e)
        return summary
      })
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
  }

  async getExam(examId: string): Promise<Exam> {
    return this.view(this.stored(examId))
  }

  async updateExam(examId: string, input: UpdateExamInput): Promise<Exam> {
    const stored = this.stored(examId)
    if (input.version !== stored.version) {
      throw new ExamsConflictError('version', 'stale_version', 'the exam was changed by someone else')
    }
    const draft = clone(stored)
    const bank = { questions: this.questions }
    const violations = rangeViolations(input)

    if (input.primaryClassificationId !== undefined) {
      const violated = this.swapPrimary(draft, input.primaryClassificationId)
      if (violated) violations.push(violated)
    }
    if (input.weights) {
      const violated = this.applyManualWeights(draft, input.weights)
      if (violated) violations.push(violated)
    } else if (input.weightMode === 'inferred') {
      const primary = primaryClassification(draft)
      if (primary) primary.weightMode = 'inferred'
    }
    for (const rename of input.classifications ?? []) {
      const target = draft.classifications.find((c) => c.id === rename.id)
      if (target && rename.name !== undefined) this.renameClassification(draft, bank, target, rename.name)
    }
    for (const edit of input.categories ?? []) {
      const owner = draft.classifications.find((c) => c.categories.some((k) => k.id === edit.id))
      const target = owner?.categories.find((k) => k.id === edit.id)
      if (!owner || !target) continue
      if (edit.name !== undefined) this.renameCategory(draft, bank, owner, target, edit.name)
      const pace = {
        paceQuestions: edit.paceQuestions === undefined ? target.paceQuestions : edit.paceQuestions,
        paceMinutes: edit.paceMinutes === undefined ? target.paceMinutes : edit.paceMinutes,
      }
      const bothSet = pace.paceQuestions !== null && pace.paceMinutes !== null && pace.paceQuestions >= 1 && pace.paceMinutes >= 1
      const bothNull = pace.paceQuestions === null && pace.paceMinutes === null
      if (!bothSet && !bothNull) violations.push(violation('categories', 'pace_pair', 'set both paceQuestions and paceMinutes (each at least 1), or neither'))
      else Object.assign(target, pace)
    }
    if (violations.length) throw new ExamsValidationError(violations)

    if (input.name !== undefined) {
      this.assertNameFree(stored.subjectId, input.name, stored.id)
      draft.name = input.name.trim()
    }
    for (const field of Object.keys(RANGES) as Array<keyof typeof RANGES>) {
      if (input[field] !== undefined) draft[field] = input[field]
    }
    draft.version = stored.version + 1
    draft.updatedAt = new Date().toISOString()
    this.exams[this.exams.indexOf(stored)] = draft
    this.questions = bank.questions
    return this.view(draft)
  }

  async deleteExam(examId: string): Promise<void> {
    const stored = this.stored(examId)
    if (this.questions.some((q) => q.examId === examId)) {
      throw new ExamsConflictError('id', 'in_use', 'the exam still has questions')
    }
    this.exams.splice(this.exams.indexOf(stored), 1)
  }

  async mergeCategories(examId: string, input: MergeCategoriesInput): Promise<Exam> {
    const stored = this.stored(examId)
    const draft = clone(stored)
    const owner = draft.classifications.find((c) => c.categories.some((k) => k.id === input.from))
    const from = owner?.categories.find((k) => k.id === input.from)
    const into = owner?.categories.find((k) => k.id === input.into)
    if (!owner || !from || !into || from === into) {
      throw new ExamsValidationError([violation('from', 'merge_scope', 'merge needs two different alive categories of the same classification')])
    }
    this.questions = this.questions.map((q) => {
      if (q.examId !== examId || !q.categories.some((r) => r.classification === owner.name && r.name === from.name)) return q
      const kept = q.categories.filter((r) => !(r.classification === owner.name && r.name === from.name))
      const hasInto = kept.some((r) => r.classification === owner.name && r.name === into.name)
      return { ...q, categories: hasInto ? kept : [...kept, { classification: owner.name, name: into.name }] }
    })
    if (owner.position === 0 && owner.weightMode === 'manual') into.weightPercent = (into.weightPercent ?? 0) + (from.weightPercent ?? 0)
    owner.categories = owner.categories.filter((k) => k !== from)
    draft.version = stored.version + 1
    draft.updatedAt = new Date().toISOString()
    this.exams[this.exams.indexOf(stored)] = draft
    return this.view(draft)
  }

  async listAttempts(examId: string): Promise<AttemptHistory> {
    return clone(this.attempts[examId] ?? { attempts: [], trend: [] })
  }

  exportUrl(examId: string): string {
    const questions = this.questions.filter((q) => q.examId === examId).map(({ id: _id, examId: _examId, version: _version, ...q }) => q)
    const body = { format: 'afwilto-questions', formatVersion: 1, questions }
    return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(body))}`
  }

  // ── bank and import (next commit) ─────────────────────────────────────────

  async importQuestions(_examId: string, _file: File, _options: ImportOptions): Promise<ImportReport> {
    throw new Error('not implemented')
  }
  async listQuestions(_examId: string, _filter?: QuestionFilter): Promise<QuestionSummary[]> {
    throw new Error('not implemented')
  }
  async getQuestion(_questionId: string): Promise<ExamQuestion> {
    throw new Error('not implemented')
  }
  async deleteQuestion(_questionId: string): Promise<void> {
    throw new Error('not implemented')
  }

  mediaUrl(sha256: string): string | null {
    return this.media[sha256] ?? null
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private stored(examId: string): Exam {
    const exam = this.exams.find((e) => e.id === examId)
    if (!exam) throw new ExamsNotFoundError('exam not found')
    return exam
  }

  private assertNameFree(subjectId: string, name: string, exceptId?: string) {
    if (this.exams.some((e) => e.id !== exceptId && e.subjectId === subjectId && fold(e.name) === fold(name))) {
      throw new ExamsConflictError('name', 'duplicate_name', 'an exam with that name already exists in this subject')
    }
  }

  /** A copy of the exam with the counts and the inferred weights derived from the bank. */
  private view(exam: Exam): Exam {
    const copy = clone(exam)
    const mine = this.questions.filter((q) => q.examId === exam.id)
    copy.questionTotal = mine.length
    copy.classifications.sort((a, b) => a.position - b.position)
    for (const classification of copy.classifications) {
      for (const category of classification.categories) {
        category.questionCount = mine.filter((q) => q.categories.some((r) => r.classification === classification.name && r.name === category.name)).length
      }
      if (classification.position === 0 && classification.weightMode === 'inferred') {
        const weights = inferWeights(classification.categories.map((c) => c.questionCount))
        classification.categories.forEach((c, i) => (c.weightPercent = weights[i]))
      }
      if (classification.position !== 0) classification.categories.forEach((c) => (c.weightPercent = null))
    }
    return copy
  }

  private swapPrimary(draft: Exam, classificationId: string): ExamsViolation | undefined {
    const next = draft.classifications.find((c) => c.id === classificationId)
    const current = primaryClassification(draft)
    if (!next || next === current) return undefined
    const crowded = this.questions.some((q) => q.examId === draft.id && q.categories.filter((r) => r.classification === next.name).length > 1)
    if (crowded) return violation('primaryClassificationId', 'primary_single_valued', 'a question has more than one category in that classification')
    if (current) {
      current.position = 1
      current.categories.forEach((c) => (c.weightPercent = null))
    }
    next.position = 0
    next.weightMode = 'inferred'
    return undefined
  }

  private applyManualWeights(draft: Exam, weights: NonNullable<UpdateExamInput['weights']>): ExamsViolation | undefined {
    const primary = primaryClassification(draft)
    const ids = new Set(primary?.categories.map((c) => c.id))
    const covers = weights.length === ids.size && weights.every((w) => ids.has(w.categoryId))
    const integers = weights.every((w) => Number.isInteger(w.percent) && w.percent >= 0)
    if (!primary || !covers || !integers || weights.reduce((sum, w) => sum + w.percent, 0) !== 100) {
      return violation('weights', 'weights_sum', 'weights must cover every category of the primary classification and sum to 100')
    }
    for (const w of weights) primary.categories.find((c) => c.id === w.categoryId)!.weightPercent = w.percent
    primary.weightMode = 'manual'
    return undefined
  }

  private renameClassification(draft: Exam, bank: Bank, target: Classification, name: string) {
    if (draft.classifications.some((c) => c !== target && fold(c.name) === fold(name))) {
      throw new ExamsConflictError('classifications', 'duplicate_name', 'a classification with that name already exists')
    }
    relink(bank, draft.id, (r) => (r.classification === target.name ? { ...r, classification: name.trim() } : r))
    target.name = name.trim()
  }

  private renameCategory(draft: Exam, bank: Bank, owner: Classification, target: ExamCategory, name: string) {
    if (owner.categories.some((c) => c !== target && fold(c.name) === fold(name))) {
      throw new ExamsConflictError('categories', 'duplicate_name', 'a category with that name already exists in the classification')
    }
    relink(bank, draft.id, (r) => (r.classification === owner.name && r.name === target.name ? { ...r, name: name.trim() } : r))
    target.name = name.trim()
  }
}
