import type {
  AttemptHistory,
  CreateExamInput,
  Exam,
  ExamQuestion,
  ExamSummary,
  ImportOptions,
  ImportReport,
  MergeCategoriesInput,
  QuestionFilter,
  QuestionSummary,
  UpdateExamInput,
} from '@/exams/domain'
import {
  ExamsConflictError,
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

const RANGES: Array<[keyof Omit<CreateExamInput, 'name'>, number, number]> = [
  ['questionCount', 1, 200],
  ['timeLimitMin', 1, 600],
  ['passPercent', 1, 100],
]

const normalize = (name: string) => name.trim().toLowerCase()

export class InMemoryExamsAdapter implements IExamsService {
  private readonly exams: Exam[]
  private readonly media: Record<string, string>

  constructor(seed: ExamsSeed) {
    this.exams = [...seed.exams]
    this.media = { ...seed.media }
  }

  async createExam(subjectId: string, input: CreateExamInput): Promise<Exam> {
    const violations: ExamsViolation[] = RANGES.filter(([field, min, max]) => !(input[field] >= min && input[field] <= max)).map(
      ([field, min, max]) => ({ field, rule: 'range', message: `must be between ${min} and ${max}` })
    )
    if (violations.length) throw new ExamsValidationError(violations)
    if (this.exams.some((e) => e.subjectId === subjectId && normalize(e.name) === normalize(input.name))) {
      throw new ExamsConflictError('name', 'duplicate_name', 'an exam with that name already exists in this subject')
    }
    const now = new Date().toISOString()
    const exam: Exam = { id: crypto.randomUUID(), subjectId, ...input, name: input.name.trim(), questionTotal: 0, classifications: [], version: 1, createdAt: now, updatedAt: now }
    this.exams.push(exam)
    return exam
  }

  async listExams(_subjectId: string): Promise<ExamSummary[]> {
    throw new Error('not implemented')
  }
  async getExam(_examId: string): Promise<Exam> {
    throw new Error('not implemented')
  }
  async updateExam(_examId: string, _input: UpdateExamInput): Promise<Exam> {
    throw new Error('not implemented')
  }
  async deleteExam(_examId: string): Promise<void> {
    throw new Error('not implemented')
  }
  async mergeCategories(_examId: string, _input: MergeCategoriesInput): Promise<Exam> {
    throw new Error('not implemented')
  }
  async importQuestions(_examId: string, _file: File, _options: ImportOptions): Promise<ImportReport> {
    throw new Error('not implemented')
  }
  exportUrl(_examId: string): string {
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
  async listAttempts(_examId: string): Promise<AttemptHistory> {
    throw new Error('not implemented')
  }

  mediaUrl(sha256: string): string | null {
    return this.media[sha256] ?? null
  }
}
