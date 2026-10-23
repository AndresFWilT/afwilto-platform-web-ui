import type {
  AnswerInput,
  AnswerOutcome,
  Attempt,
  AttemptHistory,
  AttemptReport,
  AttemptResult,
  CreateExamInput,
  Exam,
  ExamQuestion,
  ExamSummary,
  ImportOptions,
  ImportReport,
  MergeCategoriesInput,
  QuestionFilter,
  QuestionSummary,
  SessionConfig,
  SessionPreview,
  UpdateExamInput,
} from '@/exams/domain'

/** What the UI needs from the exams backend. */
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

  /** Pool size, draw size, suggested minutes and shortages of a config; no side effects. @throws ExamsNotFoundError, ExamsValidationError */
  previewSession(examId: string, config: SessionConfig): Promise<SessionPreview>
  /**
   * Draws the questions, freezes the snapshot and starts an attempt. `seed` makes the draw repeatable.
   * @throws ExamsAttemptInProgressError (BR-A1), ExamsValidationError (`insufficient_questions`, `locked_by_simulation`)
   *   or ExamsNotFoundError.
   */
  startAttempt(examId: string, config: SessionConfig, seed?: number): Promise<Attempt>
  /** The attempt with its saved answers and `remainingSeconds`; an expired attempt is closed first. @throws ExamsNotFoundError */
  getAttempt(attemptId: string): Promise<Attempt>
  /**
   * Saves the answer and the flag of one item (`position` is 0-based). Under feedback `each` the first
   * non-empty selection comes back with its reveal and locks.
   * @throws ExamsValidationError (`invalid_label`, `too_many_selected`), ExamsConflictError
   *   (`answer_locked`, `attempt_expired`, `attempt_closed`) or ExamsNotFoundError.
   */
  answerItem(attemptId: string, position: number, answer: AnswerInput): Promise<AnswerOutcome>
  /** Closes and scores the attempt. @throws ExamsConflictError (`attempt_closed`) or ExamsNotFoundError. */
  submitAttempt(attemptId: string): Promise<AttemptResult>
  /** The score, the breakdown and every item with its answer key. @throws ExamsAttemptInProgressError while open, ExamsNotFoundError */
  getAttemptReport(attemptId: string): Promise<AttemptReport>
}
