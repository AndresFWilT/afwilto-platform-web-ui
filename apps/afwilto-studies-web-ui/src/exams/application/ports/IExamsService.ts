import type { CreateExamInput, Exam } from '@/exams/domain'

/** What the UI needs from the exams backend. Grows with slices 08 and 09. */
export interface IExamsService {
  /** @throws ExamsValidationError (a field out of range) or ExamsConflictError (`duplicate_name`). */
  createExam(subjectId: string, input: CreateExamInput): Promise<Exam>
  /** The URL of a stored image, or null when `sha256` is not a content hash this service can serve. */
  mediaUrl(sha256: string): string | null
}
