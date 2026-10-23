import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { ExamsHttpAdapter } from '../../src/exams/infrastructure/http/ExamsHttpAdapter'
import { ExamsConflictError, ExamsNotFoundError, ExamsValidationError } from '../../src/exams/application/ports'
import { EXAM_ID, SUBJECT_ID, examFixture } from './examFixtures'

function makeHttpClient(): IHttpClient {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), postMultipart: vi.fn() }
}

const API = 'http://localhost:8084/api/v1'
const envelope = (code: string, message: string, details?: unknown[]) => ({ error: { code, message, ...(details ? { details } : {}) } })

describe('ExamsHttpAdapter: managing exams (slice 08)', () => {
  let http: IHttpClient
  let adapter: ExamsHttpAdapter

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new ExamsHttpAdapter(http, API)
  })

  it('listExams GETs the subject exams and unwraps the list', async () => {
    const summary = { ...examFixture(), classifications: undefined, questionTotal: 13, lastSimulation: { scorePercent: 78.5, passed: true, at: '2026-10-22T10:00:00Z' } }
    vi.mocked(http.get).mockResolvedValue({ data: [summary], meta: { totalItems: 1 } })
    expect(await adapter.listExams(SUBJECT_ID)).toEqual([summary])
    expect(http.get).toHaveBeenCalledWith(`/subjects/${SUBJECT_ID}/exams`)
  })

  it('getExam GETs the exam and unwraps the envelope', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: examFixture() })
    expect(await adapter.getExam(EXAM_ID)).toEqual(examFixture())
    expect(http.get).toHaveBeenCalledWith(`/exams/${EXAM_ID}`)
  })

  it('updateExam PATCHes the whole input, including the version, and unwraps the envelope', async () => {
    const input = { version: 3, name: 'SAA', weights: [{ categoryId: 'c1', percent: 100 }], categories: [{ id: 'c1', paceQuestions: null, paceMinutes: null }] }
    vi.mocked(http.patch).mockResolvedValue({ data: examFixture({ version: 4 }) })
    expect((await adapter.updateExam(EXAM_ID, input)).version).toBe(4)
    expect(http.patch).toHaveBeenCalledWith(`/exams/${EXAM_ID}`, input)
  })

  it('updateExam sends weightMode "inferred" untouched (S08-4)', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: examFixture() })
    await adapter.updateExam(EXAM_ID, { version: 1, weightMode: 'inferred' })
    expect(http.patch).toHaveBeenCalledWith(`/exams/${EXAM_ID}`, { version: 1, weightMode: 'inferred' })
  })

  it('deleteExam DELETEs the exam', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await adapter.deleteExam(EXAM_ID)
    expect(http.delete).toHaveBeenCalledWith(`/exams/${EXAM_ID}`)
  })

  it('mergeCategories POSTs {from, into} and returns the exam (S08-5)', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: examFixture({ version: 2 }) })
    expect((await adapter.mergeCategories(EXAM_ID, { from: 'f', into: 'i' })).version).toBe(2)
    expect(http.post).toHaveBeenCalledWith(`/exams/${EXAM_ID}/categories/merge`, { from: 'f', into: 'i' })
  })

  it('exportUrl is an anchor target built from the API base, with no request (S08-8)', () => {
    expect(adapter.exportUrl(EXAM_ID)).toBe(`${API}/exams/${EXAM_ID}/questions/export`)
    expect(new ExamsHttpAdapter(http, `${API}/`).exportUrl(EXAM_ID)).toBe(`${API}/exams/${EXAM_ID}/questions/export`)
    expect(http.get).not.toHaveBeenCalled()
  })

  it('listAttempts unwraps the history and the trend, turning null passed into absent', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: [
        { id: 'a2', selectionKind: 'simulation', timingKind: 'timed', feedback: 'end', status: 'submitted', startedAt: '2026-10-22T10:00:00Z', durationSeconds: 3000, scorePercent: 80, passed: true },
        { id: 'a1', selectionKind: 'random', timingKind: 'untimed', feedback: 'each', status: 'in_progress', startedAt: '2026-10-21T10:00:00Z', passed: null },
      ],
      meta: { totalItems: 2, trend: [{ at: '2026-10-22T10:00:00Z', scorePercent: 80 }] },
    })
    const history = await adapter.listAttempts(EXAM_ID)
    expect(http.get).toHaveBeenCalledWith(`/exams/${EXAM_ID}/attempts`)
    expect(history.trend).toEqual([{ at: '2026-10-22T10:00:00Z', scorePercent: 80 }])
    expect(history.attempts.map((a) => [a.id, a.passed, a.scorePercent])).toEqual([
      ['a2', true, 80],
      ['a1', undefined, undefined],
    ])
  })

  describe('error translation for the new calls', () => {
    it('a stale version is an ExamsConflictError with rule stale_version', async () => {
      const details = [{ field: 'version', rule: 'stale_version', message: 'the exam changed' }]
      vi.mocked(http.patch).mockRejectedValue(new HttpError(409, 'Conflict', envelope('conflict', 'stale', details)))
      const error = await adapter.updateExam(EXAM_ID, { version: 1 }).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ExamsConflictError)
      expect((error as ExamsConflictError).rule).toBe('stale_version')
    })

    it('weights that do not sum to 100 are an ExamsValidationError', async () => {
      const details = [{ field: 'weights', rule: 'weights_sum', message: 'must sum to 100' }]
      vi.mocked(http.patch).mockRejectedValue(new HttpError(422, 'Unprocessable', envelope('validation_failed', 'bad', details)))
      const error = await adapter.updateExam(EXAM_ID, { version: 1 }).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ExamsValidationError)
      expect((error as ExamsValidationError).messageFor('weights')).toBe('must sum to 100')
    })

    it('deleting an exam with questions is an ExamsConflictError with rule in_use', async () => {
      const details = [{ field: 'id', rule: 'in_use', message: 'it has questions' }]
      vi.mocked(http.delete).mockRejectedValue(new HttpError(409, 'Conflict', envelope('conflict', 'in use', details)))
      const error = await adapter.deleteExam(EXAM_ID).catch((e: unknown) => e)
      expect((error as ExamsConflictError).rule).toBe('in_use')
    })

    it('a missing exam is an ExamsNotFoundError', async () => {
      vi.mocked(http.get).mockRejectedValue(new HttpError(404, 'Not Found', envelope('not_found', 'exam not found')))
      await expect(adapter.getExam(EXAM_ID)).rejects.toBeInstanceOf(ExamsNotFoundError)
    })
  })

  it('countUnclassified reads meta.totalItems of the unclassified bank query (page size 1), not the classifications', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [{}], meta: { totalItems: 7 } })
    expect(await adapter.countUnclassified(EXAM_ID)).toBe(7)
    expect(http.get).toHaveBeenCalledWith(`/exams/${EXAM_ID}/questions?unclassified=true&pageSize=1`)
  })

  it('countUnclassified without meta.totalItems is an error, never a made-up 0', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [] })
    await expect(adapter.countUnclassified(EXAM_ID)).rejects.toBeInstanceOf(Error)
  })

  it('countUnclassified of an unknown exam is an ExamsNotFoundError', async () => {
    vi.mocked(http.get).mockRejectedValue(new HttpError(404, 'Not Found', envelope('not_found', 'no exam')))
    await expect(adapter.countUnclassified(EXAM_ID)).rejects.toBeInstanceOf(ExamsNotFoundError)
  })
})
