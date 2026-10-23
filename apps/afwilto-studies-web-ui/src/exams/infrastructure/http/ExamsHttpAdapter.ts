import { HttpError, type IHttpClient } from '@afwilto/http-client'
import type {
  AttemptHistory,
  AttemptSummary,
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
  ExamsNotFoundError,
  ExamsValidationError,
  type ExamsConflictRule,
  type ExamsViolation,
  type IExamsService,
} from '@/exams/application/ports'

interface WireError {
  error?: { code?: string; message?: string; details?: ExamsViolation[] }
}

type WireAttempt = Omit<AttemptSummary, 'passed'> & { passed?: boolean | null }

const SHA256 = /^[0-9a-f]{64}$/

/** HTTP failures → the port's domain errors; status codes never leave the adapter. */
function translateError(e: unknown): Error {
  if (!(e instanceof HttpError)) return e instanceof Error ? e : new Error(String(e))
  const err = (e.body as WireError | null)?.error
  const details = Array.isArray(err?.details) ? err.details : []
  if (e.status === 422 && details.length) return new ExamsValidationError(details, err?.message)
  if (e.status === 409 && details.length) {
    const [first] = details
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

  importQuestions(_examId: string, _file: File, _options: ImportOptions): Promise<ImportReport> {
    throw new Error('not implemented')
  }
  exportUrl(examId: string): string {
    return `${this.apiUrl}/exams/${encodeURIComponent(examId)}/questions/export`
  }
  listQuestions(_examId: string, _filter?: QuestionFilter): Promise<QuestionSummary[]> {
    throw new Error('not implemented')
  }
  getQuestion(_questionId: string): Promise<ExamQuestion> {
    throw new Error('not implemented')
  }
  deleteQuestion(_questionId: string): Promise<void> {
    throw new Error('not implemented')
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

  mediaUrl(sha256: string): string | null {
    return SHA256.test(sha256) ? `${this.apiUrl}/media/${sha256}` : null
  }
}
