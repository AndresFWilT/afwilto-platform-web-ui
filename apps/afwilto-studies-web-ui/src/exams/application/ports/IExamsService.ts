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

/** What the UI needs from the exams backend. Slice 09 adds sessions, attempts and review. */
export interface IExamsService {
  /** @throws ExamsValidationError (a field out of range) or ExamsConflictError (`duplicate_name`). */
  createExam(subjectId: string, input: CreateExamInput): Promise<Exam>
  /** The URL of a stored image, or null when `sha256` is not a content hash this service can serve. */
  mediaUrl(sha256: string): string | null

  /** Alive exams of a subject, ordered by name. */
  listExams(subjectId: string): Promise<ExamSummary[]>
  /** @throws ExamsNotFoundError */
  getExam(examId: string): Promise<Exam>
  /**
   * Edits the parameters, names, weights and pace atomically under `input.version`.
   * @throws ExamsValidationError (`range`, `weights_sum`, `pace_pair`, `primary_single_valued`),
   *   ExamsConflictError (`duplicate_name`, `stale_version`) or ExamsNotFoundError.
   */
  updateExam(examId: string, input: UpdateExamInput): Promise<Exam>
  /** @throws ExamsConflictError (`in_use` while alive questions exist) or ExamsNotFoundError. */
  deleteExam(examId: string): Promise<void>
  /** Moves the questions of `from` into `into` (same classification) and returns the exam. @throws ExamsValidationError (`merge_scope`). */
  mergeCategories(examId: string, input: MergeCategoriesInput): Promise<Exam>

  /**
   * Dry run or apply of a questions file. Resolves with the report whenever the server produced one,
   * including an apply that was refused for its errors (`report.applied === false`, `report.errors` set).
   * @throws ExamsValidationError when the file itself is unusable (`file_type`, `zip_*`, `json`).
   */
  importQuestions(examId: string, file: File, options: ImportOptions): Promise<ImportReport>
  /** The `href` of the bank export (a .zip). The UI downloads it with an anchor, never with fetch. */
  exportUrl(examId: string): string

  listQuestions(examId: string, filter?: QuestionFilter): Promise<QuestionSummary[]>
  /** @throws ExamsNotFoundError */
  getQuestion(questionId: string): Promise<ExamQuestion>
  /** @throws ExamsNotFoundError */
  deleteQuestion(questionId: string): Promise<void>

  /** Attempts of the exam, newest first, with the simulation-only trend. */
  listAttempts(examId: string): Promise<AttemptHistory>
}
