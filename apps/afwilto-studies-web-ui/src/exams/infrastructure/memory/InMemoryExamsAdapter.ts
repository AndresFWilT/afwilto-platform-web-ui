import type { CreateExamInput, Exam } from '@/exams/domain'
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
    const exam: Exam = { id: crypto.randomUUID(), subjectId, ...input, name: input.name.trim(), version: 1, createdAt: now, updatedAt: now }
    this.exams.push(exam)
    return exam
  }

  mediaUrl(sha256: string): string | null {
    return this.media[sha256] ?? null
  }
}
