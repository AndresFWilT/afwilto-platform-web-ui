import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { ExamsHttpAdapter } from '../../src/exams/infrastructure/http/ExamsHttpAdapter'
import { ExamsConflictError, ExamsNotFoundError, ExamsValidationError } from '../../src/exams/application/ports'

function makeHttpClient(): IHttpClient {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), postMultipart: vi.fn() }
}

const API = 'http://localhost:8084/api/v1'
const SHA = 'cd34'.repeat(16)
const INPUT = { name: 'SAA-C03', questionCount: 65, timeLimitMin: 130, passPercent: 72 }
const EXAM = { id: 'x-1', subjectId: 's-1', ...INPUT, version: 1, createdAt: '2026-10-22T10:00:00Z', updatedAt: '2026-10-22T10:00:00Z' }

function envelope(code: string, message: string, details?: unknown[]) {
  return { error: { code, message, ...(details ? { details } : {}) } }
}

describe('ExamsHttpAdapter (S07-7)', () => {
  let http: IHttpClient
  let adapter: ExamsHttpAdapter

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new ExamsHttpAdapter(http, API)
  })

  describe('requests', () => {
    it('createExam POSTs the four fields to the subject and unwraps the envelope', async () => {
      vi.mocked(http.post).mockResolvedValue({ data: EXAM })
      expect(await adapter.createExam('s-1', INPUT)).toEqual(EXAM)
      expect(http.post).toHaveBeenCalledWith('/subjects/s-1/exams', INPUT)
    })
  })

  describe('error translation: callers never see a status code', () => {
    it('422 becomes ExamsValidationError carrying the details', async () => {
      const details = [
        { field: 'questionCount', rule: 'range', message: 'must be between 1 and 200' },
        { field: 'passPercent', rule: 'range', message: 'must be between 1 and 100' },
      ]
      vi.mocked(http.post).mockRejectedValue(new HttpError(422, 'Unprocessable', envelope('validation_failed', 'invalid', details)))
      const error = await adapter.createExam('s-1', INPUT).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ExamsValidationError)
      expect((error as ExamsValidationError).details).toEqual(details)
      expect((error as ExamsValidationError).messageFor('passPercent')).toBe('must be between 1 and 100')
      expect(error).not.toBeInstanceOf(HttpError)
    })

    it('409 becomes ExamsConflictError carrying the rule and field', async () => {
      const details = [{ field: 'name', rule: 'duplicate_name', message: 'an exam with that name exists' }]
      vi.mocked(http.post).mockRejectedValue(new HttpError(409, 'Conflict', envelope('conflict', 'conflict', details)))
      const error = await adapter.createExam('s-1', INPUT).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ExamsConflictError)
      expect((error as ExamsConflictError).rule).toBe('duplicate_name')
      expect((error as ExamsConflictError).field).toBe('name')
      expect((error as ExamsConflictError).message).toBe('an exam with that name exists')
    })

    it('404 becomes ExamsNotFoundError', async () => {
      vi.mocked(http.post).mockRejectedValue(new HttpError(404, 'Not Found', envelope('not_found', 'subject not found')))
      await expect(adapter.createExam('s-1', INPUT)).rejects.toBeInstanceOf(ExamsNotFoundError)
    })

    it('any other failure is a plain Error with the server message and no status', async () => {
      vi.mocked(http.post).mockRejectedValue(new HttpError(500, 'Server Error', envelope('internal', 'database is down')))
      const error = (await adapter.createExam('s-1', INPUT).catch((e: unknown) => e)) as Error
      expect(error).not.toBeInstanceOf(HttpError)
      expect(error.message).toBe('database is down')
    })

    it('a failure without a body says the request failed, without a status code', async () => {
      vi.mocked(http.post).mockRejectedValue(new HttpError(502, 'Bad Gateway', null))
      const error = (await adapter.createExam('s-1', INPUT).catch((e: unknown) => e)) as Error
      expect(error).not.toBeInstanceOf(HttpError)
      expect(error.message).not.toMatch(/502/)
    })

    it('a network failure passes through unchanged', async () => {
      const boom = new TypeError('Failed to fetch')
      vi.mocked(http.post).mockRejectedValue(boom)
      await expect(adapter.createExam('s-1', INPUT)).rejects.toBe(boom)
    })
  })

  describe('mediaUrl', () => {
    it('is the API base plus /media/<sha>, without repeating /api/v1', () => {
      expect(adapter.mediaUrl(SHA)).toBe(`${API}/media/${SHA}`)
    })

    it('ignores a trailing slash on the base', () => {
      expect(new ExamsHttpAdapter(http, `${API}/`).mediaUrl(SHA)).toBe(`${API}/media/${SHA}`)
    })

    it('returns null for anything that is not a 64-hex content hash', () => {
      expect(adapter.mediaUrl('../secrets')).toBeNull()
      expect(adapter.mediaUrl('img/r101.png')).toBeNull()
    })
  })
})
