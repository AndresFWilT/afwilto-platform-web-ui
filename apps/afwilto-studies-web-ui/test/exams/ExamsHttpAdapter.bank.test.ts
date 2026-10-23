import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { ExamsHttpAdapter } from '../../src/exams/infrastructure/http/ExamsHttpAdapter'
import { ExamsNotFoundError, ExamsValidationError } from '../../src/exams/application/ports'
import { EXAM_ID, reportFixture } from './examFixtures'

function makeHttpClient(): IHttpClient {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), postMultipart: vi.fn() }
}

const API = 'http://localhost:8084/api/v1'
const SHA = 'a1'.repeat(32)
const FILE = new File(['{}'], 'questions.json', { type: 'application/json' })

const wireQuestion = {
  id: 'q-1',
  examId: EXAM_ID,
  key: 'k1',
  type: 'single',
  stem: 'Stem',
  explanation: null,
  difficulty: null,
  source: { kind: 'own', name: 'mine' },
  origin: null,
  categories: [{ classification: 'Dominio', name: 'Seguridad' }],
  options: [
    { position: 0, label: 'A', text: 'a', correct: false },
    { position: 1, label: 'B', text: 'b', correct: true, rationale: 'because' },
  ],
  version: 2,
  createdAt: '2026-10-22T10:00:00Z',
  updatedAt: '2026-10-22T10:00:00Z',
}

describe('ExamsHttpAdapter: import, bank (slice 08)', () => {
  let http: IHttpClient
  let adapter: ExamsHttpAdapter

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new ExamsHttpAdapter(http, API)
  })

  describe('importQuestions', () => {
    it('posts the file as multipart with dryRun and the primary, and unwraps the report', async () => {
      const report = reportFixture()
      vi.mocked(http.postMultipart).mockResolvedValue({ data: report })
      expect(await adapter.importQuestions(EXAM_ID, FILE, { dryRun: true, primary: 'Servicio' })).toEqual(report)
      const [url, form] = vi.mocked(http.postMultipart).mock.calls[0] as [string, FormData]
      expect(url).toBe(`/exams/${EXAM_ID}/questions/import?dryRun=true&primary=Servicio`)
      expect(form.get('file')).toBeInstanceOf(File)
      expect((form.get('file') as File).name).toBe('questions.json')
    })

    it('sends dryRun=false for an apply and no primary when there is none', async () => {
      vi.mocked(http.postMultipart).mockResolvedValue({ data: reportFixture({ applied: true, dryRun: false }) })
      await adapter.importQuestions(EXAM_ID, FILE, { dryRun: false })
      expect(vi.mocked(http.postMultipart).mock.calls[0][0]).toBe(`/exams/${EXAM_ID}/questions/import?dryRun=false`)
    })

    it('encodes a primary name with spaces and accents', async () => {
      vi.mocked(http.postMultipart).mockResolvedValue({ data: reportFixture() })
      await adapter.importQuestions(EXAM_ID, FILE, { dryRun: true, primary: 'Módulo básico' })
      expect(vi.mocked(http.postMultipart).mock.calls[0][0]).toContain('primary=M%C3%B3dulo+b%C3%A1sico')
    })

    it('a 422 that carries a report resolves with the report: an apply refused for its errors (S08 confirm flow)', async () => {
      const report = reportFixture({ dryRun: false, applied: false, errors: [{ path: 'questions[3].options', rule: 'correct_count', message: 'one correct' }] })
      vi.mocked(http.postMultipart).mockRejectedValue(new HttpError(422, 'Unprocessable', { data: report }))
      expect(await adapter.importQuestions(EXAM_ID, FILE, { dryRun: false })).toEqual(report)
    })

    it('a 422 that is an error envelope (the file itself is unusable) is an ExamsValidationError', async () => {
      const details = [{ field: 'file', rule: 'file_type', message: 'only .json or .zip' }]
      vi.mocked(http.postMultipart).mockRejectedValue(new HttpError(422, 'Unprocessable', { error: { code: 'validation_failed', message: 'bad file', details } }))
      const error = await adapter.importQuestions(EXAM_ID, FILE, { dryRun: true }).catch((e: unknown) => e)
      expect(error).toBeInstanceOf(ExamsValidationError)
      expect((error as ExamsValidationError).messageFor('file')).toBe('only .json or .zip')
    })

    it('a 413 is a plain error with the server message and no status', async () => {
      vi.mocked(http.postMultipart).mockRejectedValue(new HttpError(413, 'Too Large', { error: { code: 'payload_too_large', message: 'file too large' } }))
      const error = (await adapter.importQuestions(EXAM_ID, FILE, { dryRun: true }).catch((e: unknown) => e)) as Error
      expect(error).not.toBeInstanceOf(HttpError)
      expect(error.message).toBe('file too large')
    })
  })

  describe('listQuestions', () => {
    const wireSummary = { id: 'q-1', key: 'k1', type: 'single', stemExcerpt: 'Stem', categories: [], difficulty: null, origin: null, version: 1, updatedAt: '2026-10-22T10:00:00Z' }

    it('GETs the bank with no query string when there are no filters', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: [], meta: { totalItems: 0 } })
      await adapter.listQuestions(EXAM_ID)
      expect(http.get).toHaveBeenCalledWith(`/exams/${EXAM_ID}/questions`)
    })

    it('sends every filter the caller set, and only those (S08-6)', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: [], meta: { totalItems: 0 } })
      await adapter.listQuestions(EXAM_ID, { category: 'cat-1', q: 'bucket' })
      expect(http.get).toHaveBeenLastCalledWith(`/exams/${EXAM_ID}/questions?category=cat-1&q=bucket`)
      await adapter.listQuestions(EXAM_ID, { origin: 'TD Set 1', difficulty: 'hard', unclassified: true })
      expect(http.get).toHaveBeenLastCalledWith(`/exams/${EXAM_ID}/questions?origin=TD+Set+1&difficulty=hard&unclassified=true`)
      await adapter.listQuestions(EXAM_ID, { q: '', unclassified: false })
      expect(http.get).toHaveBeenLastCalledWith(`/exams/${EXAM_ID}/questions`)
    })

    it('turns null difficulty and origin into absent fields', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: [wireSummary, { ...wireSummary, id: 'q-2', difficulty: 'easy', origin: { set: 'S', number: 2 } }], meta: {} })
      const [first, second] = await adapter.listQuestions(EXAM_ID)
      expect(first).not.toHaveProperty('difficulty')
      expect(first).not.toHaveProperty('origin')
      expect(second).toMatchObject({ difficulty: 'easy', origin: { set: 'S', number: 2 } })
    })
  })

  describe('questions', () => {
    it('getQuestion unwraps the envelope and turns null explanation, difficulty and origin into absent fields', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: wireQuestion })
      const q = await adapter.getQuestion('q-1')
      expect(http.get).toHaveBeenCalledWith('/questions/q-1')
      expect(q).not.toHaveProperty('explanation')
      expect(q).not.toHaveProperty('difficulty')
      expect(q).not.toHaveProperty('origin')
      expect(q.options.map((o) => [o.label, o.correct])).toEqual([['A', false], ['B', true]])
      expect(q.categories).toEqual([{ classification: 'Dominio', name: 'Seguridad' }])
    })

    it('keeps an explanation and an image reference', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: { ...wireQuestion, explanation: 'Why', options: [{ position: 0, label: 'A', image: `media:${SHA}`, alt: 'pic', correct: true }, wireQuestion.options[0]] } })
      const q = await adapter.getQuestion('q-1')
      expect(q.explanation).toBe('Why')
      expect(q.options[0]).toMatchObject({ image: `media:${SHA}`, alt: 'pic' })
    })

    it('getQuestion of a missing id is an ExamsNotFoundError', async () => {
      vi.mocked(http.get).mockRejectedValue(new HttpError(404, 'Not Found', { error: { code: 'not_found', message: 'gone' } }))
      await expect(adapter.getQuestion('q-1')).rejects.toBeInstanceOf(ExamsNotFoundError)
    })

    it('deleteQuestion DELETEs the question', async () => {
      vi.mocked(http.delete).mockResolvedValue(undefined)
      await adapter.deleteQuestion('q-1')
      expect(http.delete).toHaveBeenCalledWith('/questions/q-1')
    })
  })
})
