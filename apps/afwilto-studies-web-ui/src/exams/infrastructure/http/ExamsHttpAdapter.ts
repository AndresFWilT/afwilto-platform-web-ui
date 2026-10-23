import { HttpError, type IHttpClient } from '@afwilto/http-client'
import type {
  AnswerInput,
  AnswerOutcome,
  Attempt,
  AttemptHistory,
  AttemptItem,
  AttemptReport,
  AttemptResult,
  AttemptReveal,
  AttemptSummary,
  CreateExamInput,
  Difficulty,
  Exam,
  ExamOption,
  ExamQuestion,
  ExamSummary,
  ImportOptions,
  ImportReport,
  MergeCategoriesInput,
  QuestionFilter,
  QuestionCategoryRef,
  QuestionOrigin,
  QuestionSummary,
  ReviewItem,
  SessionConfig,
  SessionPreview,
  UpdateExamInput,
  ViewOption,
} from '@/exams/domain'
import { buildBreakdown } from '@/exams/domain'
import {
  ExamsAttemptInProgressError,
  ExamsConflictError,
  ExamsNotFoundError,
  ExamsValidationError,
  type ExamsConflictRule,
  type ExamsViolation,
  type IExamsService,
} from '@/exams/application/ports'

interface WireError {
  error?: { code?: string; message?: string; details?: ExamsViolation[] }
}

/** The wire sends null where the domain leaves the field out. */
const optional = <T extends object>(fields: T): Partial<{ [K in keyof T]: NonNullable<T[K]> }> =>
  Object.fromEntries(Object.entries(fields).filter(([, v]) => v != null)) as Partial<{ [K in keyof T]: NonNullable<T[K]> }>

type WireSummary = Omit<QuestionSummary, 'difficulty' | 'origin'> & { difficulty: Difficulty | null; origin: QuestionOrigin | null }
type WireOption = ExamOption & { position?: number }
type WireQuestion = Omit<ExamQuestion, 'explanation' | 'difficulty' | 'origin' | 'options'> & {
  explanation: string | null
  difficulty: Difficulty | null
  origin: QuestionOrigin | null
  options: WireOption[]
}
type WireReport = Omit<ImportReport, 'preview'> & { preview: WireQuestion[] }

function fromWireQuestion(q: WireQuestion): ExamQuestion {
  const { explanation, difficulty, origin, options, ...rest } = q
  return {
    id: rest.id,
    examId: rest.examId,
    key: rest.key,
    type: rest.type,
    stem: rest.stem,
    categories: rest.categories,
    version: rest.version,
    ...optional({ explanation, difficulty, origin }),
    options: options.map(({ position: _position, ...option }) => option),
  }
}

const fromWireReport = (report: WireReport): ImportReport => ({ ...report, preview: report.preview.map(fromWireQuestion) })

type WireAttempt = Omit<AttemptSummary, 'passed'> & { passed?: boolean | null }

interface WireReveal {
  correct?: boolean
  correctLabels?: string[]
  rationales?: Record<string, string>
  explanation?: string | null
}
type WireAttemptItem = Omit<AttemptItem, 'selected' | 'flagged' | 'answered' | 'reveal'> & { selected?: string[]; flagged?: boolean; answered?: boolean } & WireReveal
type WireAttemptDetail = Omit<Attempt, 'items'> & { items: WireAttemptItem[] }
type WireReviewItem = Omit<ReviewItem, 'reveal' | 'noteId'> & WireReveal & { correct: boolean; categories?: QuestionCategoryRef[]; noteId?: string | null; options: ViewOption[] }

function toReveal(wire: WireReveal): AttemptReveal | undefined {
  if (wire.correctLabels === undefined) return undefined
  return {
    correct: wire.correct ?? false,
    correctLabels: wire.correctLabels,
    rationales: wire.rationales ?? {},
    ...optional({ explanation: wire.explanation }),
  }
}

function fromWireAttempt(wire: WireAttemptDetail): Attempt {
  return {
    ...wire,
    items: wire.items.map((item): AttemptItem => {
      const { selected, flagged, answered, correct: _c, correctLabels: _l, rationales: _r, explanation: _e, ...rest } = item
      const reveal = toReveal(item)
      return { ...rest, selected: selected ?? [], flagged: flagged ?? false, answered: answered ?? false, ...(reveal && { reveal }) }
    }),
  }
}

function fromWireReview(item: WireReviewItem): ReviewItem {
  const { correct, correctLabels, rationales, explanation, categories, noteId, ...rest } = item
  return {
    ...rest,
    reveal: toReveal({ correct, correctLabels, rationales, explanation }) ?? { correct, correctLabels: [], rationales: {} },
    categories: categories ?? [],
    ...optional({ noteId }),
  }
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

const SHA256 = /^[0-9a-f]{64}$/

/** HTTP failures → the port's domain errors; status codes never leave the adapter. */
function translateError(e: unknown): Error {
  if (!(e instanceof HttpError)) return e instanceof Error ? e : new Error(String(e))
  const err = (e.body as WireError | null)?.error
  const details = Array.isArray(err?.details) ? err.details : []
  if (e.status === 422 && details.length) return new ExamsValidationError(details, err?.message)
  if (e.status === 409 && details.length) {
    const [first] = details
    if (first.rule === 'attempt_in_progress') {
      return new ExamsAttemptInProgressError(first.message.match(UUID)?.[0] ?? err?.message?.match(UUID)?.[0] ?? '', first.message || err?.message)
    }
    return new ExamsConflictError(first.field, first.rule as ExamsConflictRule, first.message || err?.message || 'conflict')
  }
  if (e.status === 404) return new ExamsNotFoundError(err?.message)
  return new Error(err?.message || details.map((d) => d.message).join('; ') || 'The request failed')
}

export class ExamsHttpAdapter implements IExamsService {
  private readonly http: IHttpClient
  private readonly apiUrl: string

  /** `apiUrl` is the API base (it already ends in `/api/v1`); media URLs are built from it. */
  constructor(http: IHttpClient, apiUrl: string) {
    this.http = http
    this.apiUrl = apiUrl.replace(/\/+$/, '')
  }

  /** Runs a request and translates its failure into the port's domain errors. */
  private async call<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (e) {
      throw translateError(e)
    }
  }

  async createExam(subjectId: string, input: CreateExamInput): Promise<Exam> {
    return this.call(async () => (await this.http.post<{ data: Exam }>(`/subjects/${encodeURIComponent(subjectId)}/exams`, input)).data)
  }

  async listExams(subjectId: string): Promise<ExamSummary[]> {
    return this.call(async () => (await this.http.get<{ data: ExamSummary[] }>(`/subjects/${encodeURIComponent(subjectId)}/exams`)).data)
  }

  async getExam(examId: string): Promise<Exam> {
    return this.call(async () => (await this.http.get<{ data: Exam }>(`/exams/${encodeURIComponent(examId)}`)).data)
  }

  async updateExam(examId: string, input: UpdateExamInput): Promise<Exam> {
    return this.call(async () => (await this.http.patch<{ data: Exam }>(`/exams/${encodeURIComponent(examId)}`, input)).data)
  }

  async deleteExam(examId: string): Promise<void> {
    return this.call(async () => {
      await this.http.delete(`/exams/${encodeURIComponent(examId)}`)
    })
  }

  async mergeCategories(examId: string, input: MergeCategoriesInput): Promise<Exam> {
    return this.call(
      async () => (await this.http.post<{ data: Exam }>(`/exams/${encodeURIComponent(examId)}/categories/merge`, input)).data
    )
  }

  async importQuestions(examId: string, file: File, options: ImportOptions): Promise<ImportReport> {
    const params = new URLSearchParams({ dryRun: String(options.dryRun) })
    if (options.primary) params.set('primary', options.primary)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await this.http.postMultipart<{ data: WireReport }>(`/exams/${encodeURIComponent(examId)}/questions/import?${params}`, form)
      return fromWireReport(res.data)
    } catch (e) {
      // A refused apply answers 422 with the full report; only an unusable file answers with the error envelope.
      const report = e instanceof HttpError && e.status === 422 ? (e.body as { data?: WireReport } | null)?.data : undefined
      if (report) return fromWireReport(report)
      throw translateError(e)
    }
  }

  exportUrl(examId: string): string {
    return `${this.apiUrl}/exams/${encodeURIComponent(examId)}/questions/export`
  }
  async listQuestions(examId: string, filter: QuestionFilter = {}): Promise<QuestionSummary[]> {
    const params = new URLSearchParams()
    if (filter.category) params.set('category', filter.category)
    if (filter.origin) params.set('origin', filter.origin)
    if (filter.difficulty) params.set('difficulty', filter.difficulty)
    if (filter.q) params.set('q', filter.q)
    if (filter.unclassified) params.set('unclassified', 'true')
    const query = params.size ? `?${params}` : ''
    return this.call(async () => {
      const res = await this.http.get<{ data: WireSummary[] }>(`/exams/${encodeURIComponent(examId)}/questions${query}`)
      return res.data.map(({ difficulty, origin, ...rest }) => ({ ...rest, ...optional({ difficulty, origin }) }))
    })
  }

  async getQuestion(questionId: string): Promise<ExamQuestion> {
    return this.call(async () => fromWireQuestion((await this.http.get<{ data: WireQuestion }>(`/questions/${encodeURIComponent(questionId)}`)).data))
  }

  async deleteQuestion(questionId: string): Promise<void> {
    return this.call(async () => {
      await this.http.delete(`/questions/${encodeURIComponent(questionId)}`)
    })
  }

  async listAttempts(examId: string): Promise<AttemptHistory> {
    return this.call(async () => {
      const res = await this.http.get<{ data: WireAttempt[]; meta?: { trend?: AttemptHistory['trend'] } }>(
        `/exams/${encodeURIComponent(examId)}/attempts`
      )
      return {
        attempts: res.data.map(({ passed, ...rest }) => ({ ...rest, ...(passed == null ? {} : { passed }) })),
        trend: res.meta?.trend ?? [],
      }
    })
  }

  async previewSession(examId: string, config: SessionConfig): Promise<SessionPreview> {
    return this.call(async () => (await this.http.post<{ data: SessionPreview }>(`/exams/${encodeURIComponent(examId)}/sessions/preview`, { config })).data)
  }

  async startAttempt(examId: string, config: SessionConfig, seed?: number): Promise<Attempt> {
    return this.call(async () => {
      const body = seed === undefined ? { config } : { config, seed }
      return fromWireAttempt((await this.http.post<{ data: WireAttemptDetail }>(`/exams/${encodeURIComponent(examId)}/attempts`, body)).data)
    })
  }

  async getAttempt(attemptId: string): Promise<Attempt> {
    return this.call(async () => fromWireAttempt((await this.http.get<{ data: WireAttemptDetail }>(`/attempts/${encodeURIComponent(attemptId)}`)).data))
  }

  async answerItem(attemptId: string, position: number, answer: AnswerInput): Promise<AnswerOutcome> {
    return this.call(async () => {
      const res = await this.http.put<{ data: WireReveal & AnswerInput & { position: number } }>(`/attempts/${encodeURIComponent(attemptId)}/items/${position}`, answer)
      const reveal = toReveal(res.data)
      return { position: res.data.position, selected: res.data.selected, flagged: res.data.flagged, ...(reveal && { reveal }) }
    })
  }

  async submitAttempt(attemptId: string): Promise<AttemptResult> {
    return this.call(async () => (await this.http.post<{ data: AttemptResult }>(`/attempts/${encodeURIComponent(attemptId)}/submit`, {})).data)
  }

  async getAttemptReport(attemptId: string): Promise<AttemptReport> {
    const attempt = await this.getAttempt(attemptId)
    if (attempt.status === 'in_progress') throw new ExamsAttemptInProgressError(attemptId)
    const [history, review] = await Promise.all([
      this.listAttempts(attempt.examId),
      this.call(async () => (await this.http.get<{ data: WireReviewItem[] }>(`/attempts/${encodeURIComponent(attemptId)}/review`)).data.map(fromWireReview)).catch((e: unknown) => {
        throw e instanceof ExamsAttemptInProgressError ? new ExamsAttemptInProgressError(attemptId, e.message) : e
      }),
    ])
    const summary = history.attempts.find((a) => a.id === attemptId)
    const correctCount = review.filter((r) => r.reveal.correct).length
    return {
      examId: attempt.examId,
      selectionKind: attempt.config.selection.kind,
      review,
      result: {
        scorePercent: summary?.scorePercent ?? (review.length ? Math.round((10000 * correctCount) / review.length) / 100 : 0),
        passed: summary?.passed ?? null,
        correctCount,
        total: review.length,
        durationSeconds: summary?.durationSeconds ?? 0,
        breakdown: buildBreakdown(review),
      },
    }
  }

  mediaUrl(sha256: string): string | null {
    return SHA256.test(sha256) ? `${this.apiUrl}/media/${sha256}` : null
  }
}
