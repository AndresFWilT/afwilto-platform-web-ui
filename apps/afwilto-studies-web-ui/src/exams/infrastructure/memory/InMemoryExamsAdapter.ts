import type { CreateExamInput, Exam } from '@/exams/domain'
import type { IExamsService } from '@/exams/application/ports'

export interface ExamsSeed {
  exams: Exam[]
  /** sha256 → data URL */
  media: Record<string, string>
}

export class InMemoryExamsAdapter implements IExamsService {
  constructor(_seed: ExamsSeed) {}

  createExam(_subjectId: string, _input: CreateExamInput): Promise<Exam> {
    return Promise.reject(new Error('not implemented'))
  }

  mediaUrl(_sha256: string): string | null {
    return null
  }
}
