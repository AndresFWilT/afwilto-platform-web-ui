import { HttpError, type IHttpClient } from '@afwilto/http-client'
import type { CreateExamInput, Exam } from '@/exams/domain'
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

  async createExam(subjectId: string, input: CreateExamInput): Promise<Exam> {
    try {
      const res = await this.http.post<{ data: Exam }>(`/subjects/${encodeURIComponent(subjectId)}/exams`, input)
      return res.data
    } catch (e) {
      throw translateError(e)
    }
  }

  mediaUrl(sha256: string): string | null {
    return SHA256.test(sha256) ? `${this.apiUrl}/media/${sha256}` : null
  }
}
