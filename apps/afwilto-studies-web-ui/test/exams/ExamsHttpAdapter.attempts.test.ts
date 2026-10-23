import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { ExamsHttpAdapter } from '../../src/exams/infrastructure/http/ExamsHttpAdapter'
import { ExamsAttemptInProgressError, ExamsConflictError, ExamsNotFoundError, ExamsValidationError } from '../../src/exams/application/ports'
import type { SessionConfig } from '../../src/exams/domain'
import { EXAM_ID } from './examFixtures'

function makeHttpClient(): IHttpClient {
  return { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), postMultipart: vi.fn() }
}

const API = 'http://localhost:8084/api/v1'
const ATTEMPT_ID = '00000000-0000-7000-8000-0000000000b1'
const OTHER_ID = '00000000-0000-7000-8000-0000000000b2'
const envelope = (code: string, message: string, details?: unknown[]) => ({ error: { code, message, ...(details ? { details } : {}) } })
const config: SessionConfig = { selection: { kind: 'random', count: 2 }, timing: { kind: 'timed', minutes: 5 }, feedback: 'each' }

const wireAttempt = (overrides: Record<string, unknown> = {}) => ({
  id: ATTEMPT_ID,
  examId: EXAM_ID,
  config,
  status: 'in_progress',
  startedAt: '2026-10-23T10:00:00Z',
  deadlineAt: '2026-10-23T10:05:00Z',
  remainingSeconds: 300,
  suggestedMinutes: 5,
  items: [
    { position: 0, stem: '¿Uno?', type: 'single', options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }] },
    {
      position: 1,
      stem: '¿Dos?',
      type: 'multi',
      chooseCount: 2,
      options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }, { label: 'C', text: 'c' }],
      selected: ['A', 'C'],
      flagged: true,
      answered: true,
      correct: false,
      correctLabels: ['A', 'B'],
      rationales: { A: 'porque sí' },
      explanation: null,
    },
  ],
  ...overrides,
})

describe('ExamsHttpAdapter: sessions and attempts (slice 09)', () => {
  let http: IHttpClient
  let adapter: ExamsHttpAdapter

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new ExamsHttpAdapter(http, API)
  })

  it('previewSession POSTs {config} to sessions/preview and unwraps the data', async () => {
    const preview = { poolSize: 84, drawCount: 20, suggestedMinutes: 40, shortages: [{ category: 'Seguridad', needed: 20, available: 12 }] }
    vi.mocked(http.post).mockResolvedValue({ data: preview })
    expect(await adapter.previewSession(EXAM_ID, config)).toEqual(preview)
    expect(http.post).toHaveBeenCalledWith(`/exams/${EXAM_ID}/sessions/preview`, { config })
  })

  it('startAttempt POSTs {config, seed} and maps the items: defaults for what the start leaves out', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: wireAttempt() })
    const attempt = await adapter.startAttempt(EXAM_ID, config, 7)
    expect(http.post).toHaveBeenCalledWith(`/exams/${EXAM_ID}/attempts`, { config, seed: 7 })
    expect(attempt).toMatchObject({ id: ATTEMPT_ID, examId: EXAM_ID, status: 'in_progress', remainingSeconds: 300, suggestedMinutes: 5 })
    expect(attempt.items[0]).toEqual({
      position: 0,
      stem: '¿Uno?',
      type: 'single',
      options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }],
      selected: [],
      flagged: false,
      answered: false,
    })
  })

  it('startAttempt without a seed sends only the config', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: wireAttempt() })
    await adapter.startAttempt(EXAM_ID, config)
    expect(http.post).toHaveBeenCalledWith(`/exams/${EXAM_ID}/attempts`, { config })
  })

  it('getAttempt restores answers, flags and the reveal of revealed items; a null explanation is absent', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: wireAttempt() })
    const attempt = await adapter.getAttempt(ATTEMPT_ID)
    expect(http.get).toHaveBeenCalledWith(`/attempts/${ATTEMPT_ID}`)
    expect(attempt.items[1]).toEqual({
      position: 1,
      stem: '¿Dos?',
      type: 'multi',
      chooseCount: 2,
      options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }, { label: 'C', text: 'c' }],
      selected: ['A', 'C'],
      flagged: true,
      answered: true,
      reveal: { correct: false, correctLabels: ['A', 'B'], rationales: { A: 'porque sí' } },
    })
  })

  it('an untimed attempt has no deadline and no remainingSeconds', async () => {
    const { deadlineAt: _d, remainingSeconds: _r, ...untimed } = wireAttempt({ config: { selection: { kind: 'random', count: 2 }, timing: { kind: 'untimed' }, feedback: 'end' } })
    vi.mocked(http.get).mockResolvedValue({ data: untimed })
    const attempt = await adapter.getAttempt(ATTEMPT_ID)
    expect(attempt).not.toHaveProperty('deadlineAt')
    expect(attempt).not.toHaveProperty('remainingSeconds')
  })

  it('startAttempt: a 409 attempt_in_progress becomes ExamsAttemptInProgressError carrying the attempt id from the message', async () => {
    const body = envelope('conflict', 'conflict', [{ field: 'attemptId', rule: 'attempt_in_progress', message: `attempt ${OTHER_ID} is in progress` }])
    vi.mocked(http.post).mockRejectedValue(new HttpError(409, 'Conflict', body))
    const error = await adapter.startAttempt(EXAM_ID, config).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ExamsAttemptInProgressError)
    expect(error).toBeInstanceOf(ExamsConflictError)
    expect((error as ExamsAttemptInProgressError).attemptId).toBe(OTHER_ID)
  })

  it('startAttempt: a 422 insufficient_questions keeps category, needed and available on each detail', async () => {
    const detail = { field: 'config', rule: 'insufficient_questions', message: 'faltan 8 en Seguridad', category: 'Seguridad', needed: 20, available: 12 }
    vi.mocked(http.post).mockRejectedValue(new HttpError(422, 'Unprocessable', envelope('validation_failed', 'not enough questions', [detail])))
    const error = (await adapter.startAttempt(EXAM_ID, config).catch((e: unknown) => e)) as ExamsValidationError
    expect(error).toBeInstanceOf(ExamsValidationError)
    expect(error.details).toEqual([detail])
  })

  it('answerItem PUTs {selected, flagged} to the 0-based position and returns the saved answer only under feedback "end" (AC-18)', async () => {
    vi.mocked(http.put).mockResolvedValue({ data: { position: 3, selected: ['B'], flagged: true } })
    const outcome = await adapter.answerItem(ATTEMPT_ID, 3, { selected: ['B'], flagged: true })
    expect(http.put).toHaveBeenCalledWith(`/attempts/${ATTEMPT_ID}/items/3`, { selected: ['B'], flagged: true })
    expect(outcome).toEqual({ position: 3, selected: ['B'], flagged: true })
  })

  it('answerItem under feedback "each" returns the reveal', async () => {
    vi.mocked(http.put).mockResolvedValue({
      data: { position: 0, selected: ['B'], flagged: false, correct: false, correctLabels: ['C'], rationales: { B: 'no' }, explanation: 'porque C' },
    })
    expect(await adapter.answerItem(ATTEMPT_ID, 0, { selected: ['B'], flagged: false })).toEqual({
      position: 0,
      selected: ['B'],
      flagged: false,
      reveal: { correct: false, correctLabels: ['C'], rationales: { B: 'no' }, explanation: 'porque C' },
    })
  })

  it.each(['answer_locked', 'attempt_expired', 'attempt_closed'])('answerItem: a 409 %s becomes an ExamsConflictError with that rule', async (rule) => {
    vi.mocked(http.put).mockRejectedValue(new HttpError(409, 'Conflict', envelope('conflict', 'x', [{ field: 'attempt', rule, message: 'no' }])))
    const error = await adapter.answerItem(ATTEMPT_ID, 0, { selected: [], flagged: false }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ExamsConflictError)
    expect((error as ExamsConflictError).rule).toBe(rule)
  })

  it('answerItem: a 422 too_many_selected becomes an ExamsValidationError', async () => {
    const detail = { field: 'selected', rule: 'too_many_selected', message: 'at most 2' }
    vi.mocked(http.put).mockRejectedValue(new HttpError(422, 'Unprocessable', envelope('validation_failed', 'x', [detail])))
    const error = (await adapter.answerItem(ATTEMPT_ID, 0, { selected: ['A', 'B', 'C'], flagged: false }).catch((e: unknown) => e)) as ExamsValidationError
    expect(error.messageFor('selected')).toBe('at most 2')
  })

  it('submitAttempt POSTs to submit and keeps passed null for practice attempts', async () => {
    const result = { scorePercent: 50, passed: null, correctCount: 1, total: 2, durationSeconds: 90, breakdown: [] }
    vi.mocked(http.post).mockResolvedValue({ data: result })
    expect(await adapter.submitAttempt(ATTEMPT_ID)).toEqual(result)
    expect(http.post).toHaveBeenCalledWith(`/attempts/${ATTEMPT_ID}/submit`, {})
  })

  it('submitAttempt: a 409 attempt_closed becomes an ExamsConflictError; a 404 an ExamsNotFoundError', async () => {
    vi.mocked(http.post).mockRejectedValueOnce(new HttpError(409, 'Conflict', envelope('conflict', 'x', [{ field: 'attempt', rule: 'attempt_closed', message: 'closed' }])))
    expect(((await adapter.submitAttempt(ATTEMPT_ID).catch((e: unknown) => e)) as ExamsConflictError).rule).toBe('attempt_closed')
    vi.mocked(http.post).mockRejectedValueOnce(new HttpError(404, 'Not Found', envelope('not_found', 'no attempt')))
    expect(await adapter.submitAttempt(ATTEMPT_ID).catch((e: unknown) => e)).toBeInstanceOf(ExamsNotFoundError)
  })
})

describe('ExamsHttpAdapter.getAttemptReport: the closed attempt\'s result plus one review (contract 0.3.0, M1)', () => {
  let http: IHttpClient
  let adapter: ExamsHttpAdapter
  const serverResult = {
    scorePercent: 69.96,
    passed: false,
    correctCount: 2,
    total: 4,
    durationSeconds: 1799,
    breakdown: [{ classification: 'Dominio', categories: [{ name: 'Costos', correct: 0, total: 2, percent: 0 }, { name: 'Seguridad', correct: 2, total: 2, percent: 100 }] }],
  }
  const closed = (overrides: Record<string, unknown> = {}) =>
    wireAttempt({ status: 'submitted', config: { selection: { kind: 'simulation' } }, result: serverResult, ...overrides })
  const reviewItem = (position: number, correct: boolean, extra: Record<string, unknown> = {}) => ({
    position,
    stem: `q${position}`,
    type: 'single',
    options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }],
    selected: [correct ? 'A' : 'B'],
    flagged: false,
    correct,
    correctLabels: ['A'],
    rationales: { A: 'sí' },
    explanation: null,
    categories: [{ classification: 'Dominio', name: position < 2 ? 'Seguridad' : 'Costos' }],
    ...extra,
  })

  function respond(attempt: unknown, review: unknown[]) {
    vi.mocked(http.get).mockImplementation(async (url: string) => {
      if (url === `/attempts/${ATTEMPT_ID}`) return { data: attempt }
      if (url === `/attempts/${ATTEMPT_ID}/review`) return { data: review, meta: { totalItems: review.length } }
      throw new Error(`unexpected GET ${url}`)
    })
  }

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new ExamsHttpAdapter(http, API)
  })

  it('returns the server result exactly as sent, even when it disagrees with the review items (no client-side score)', async () => {
    respond(closed(), [reviewItem(0, true), reviewItem(1, true), reviewItem(2, true), reviewItem(3, true, { noteId: OTHER_ID, flagged: true })])
    const report = await adapter.getAttemptReport(ATTEMPT_ID)
    expect(report.examId).toBe(EXAM_ID)
    expect(report.selectionKind).toBe('simulation')
    expect(report.result).toEqual(serverResult)
    expect(report.review[3]).toMatchObject({ position: 3, flagged: true, noteId: OTHER_ID, reveal: { correct: true, correctLabels: ['A'], rationales: { A: 'sí' } } })
    expect(report.review[0]).not.toHaveProperty('noteId')
    expect(report.review[0].reveal).not.toHaveProperty('explanation')
  })

  it('makes exactly two requests: GET the attempt and GET its review (no history list)', async () => {
    respond(closed(), [reviewItem(0, true)])
    await adapter.getAttemptReport(ATTEMPT_ID)
    expect(vi.mocked(http.get).mock.calls.map(([url]) => url).sort()).toEqual([`/attempts/${ATTEMPT_ID}`, `/attempts/${ATTEMPT_ID}/review`].sort())
  })

  it('getAttempt keeps the result of a closed attempt', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: closed() })
    expect((await adapter.getAttempt(ATTEMPT_ID)).result).toEqual(serverResult)
  })

  it('a practice attempt reports passed null as the server sends it', async () => {
    respond(closed({ config: { selection: { kind: 'random', count: 2 }, timing: { kind: 'untimed' }, feedback: 'end' }, result: { ...serverResult, passed: null } }), [reviewItem(0, true)])
    const report = await adapter.getAttemptReport(ATTEMPT_ID)
    expect(report.selectionKind).toBe('random')
    expect(report.result.passed).toBeNull()
  })

  it('a closed attempt without a result is an error, never a fabricated zero score', async () => {
    const { result: _result, ...withoutResult } = closed() as Record<string, unknown>
    respond(withoutResult, [reviewItem(0, true)])
    const error = await adapter.getAttemptReport(ATTEMPT_ID).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toHaveProperty('result')
  })

  it('an attempt still in progress is an ExamsAttemptInProgressError and the review is never requested', async () => {
    respond(wireAttempt(), [])
    const error = await adapter.getAttemptReport(ATTEMPT_ID).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ExamsAttemptInProgressError)
    expect((error as ExamsAttemptInProgressError).attemptId).toBe(ATTEMPT_ID)
    expect(http.get).not.toHaveBeenCalledWith(`/attempts/${ATTEMPT_ID}/review`)
  })

  it('an unknown attempt is an ExamsNotFoundError', async () => {
    vi.mocked(http.get).mockRejectedValue(new HttpError(404, 'Not Found', envelope('not_found', 'no attempt')))
    expect(await adapter.getAttemptReport(ATTEMPT_ID).catch((e: unknown) => e)).toBeInstanceOf(ExamsNotFoundError)
  })
})

describe('ExamsHttpAdapter.answerItem: the clock rides on the PUT (contract 0.3.0, M2)', () => {
  let http: IHttpClient
  let adapter: ExamsHttpAdapter
  beforeEach(() => {
    http = makeHttpClient()
    adapter = new ExamsHttpAdapter(http, API)
  })

  it('carries remainingSeconds of a timed attempt, with and without a reveal', async () => {
    vi.mocked(http.put).mockResolvedValueOnce({ data: { position: 0, selected: ['B'], flagged: false, remainingSeconds: 100 } })
    expect(await adapter.answerItem(ATTEMPT_ID, 0, { selected: ['B'], flagged: false })).toEqual({ position: 0, selected: ['B'], flagged: false, remainingSeconds: 100 })
    vi.mocked(http.put).mockResolvedValueOnce({ data: { position: 0, selected: ['B'], flagged: false, remainingSeconds: 0, correct: true, correctLabels: ['B'], rationales: {} } })
    expect(await adapter.answerItem(ATTEMPT_ID, 0, { selected: ['B'], flagged: false })).toMatchObject({ remainingSeconds: 0, reveal: { correct: true } })
  })

  it('an untimed attempt answers without remainingSeconds', async () => {
    vi.mocked(http.put).mockResolvedValue({ data: { position: 0, selected: [], flagged: true } })
    expect(await adapter.answerItem(ATTEMPT_ID, 0, { selected: [], flagged: true })).not.toHaveProperty('remainingSeconds')
  })
})

describe('ExamsHttpAdapter: errors are mapped by rule even when details is empty (contract 0.3.0, M3)', () => {
  let http: IHttpClient
  let adapter: ExamsHttpAdapter
  beforeEach(() => {
    http = makeHttpClient()
    adapter = new ExamsHttpAdapter(http, API)
  })

  it.each(['answer_locked', 'attempt_closed', 'attempt_expired'])('a 409 whose code names %s is an ExamsConflictError with that rule', async (rule) => {
    vi.mocked(http.put).mockRejectedValueOnce(new HttpError(409, 'Conflict', envelope(rule, 'x')))
    const byCode = (await adapter.answerItem(ATTEMPT_ID, 0, { selected: [], flagged: false }).catch((e: unknown) => e)) as ExamsConflictError
    expect(byCode).toBeInstanceOf(ExamsConflictError)
    expect(byCode.rule).toBe(rule)
  })

  it.each(['answer_locked', 'attempt_closed', 'attempt_expired'])('a 409 without details whose message merely contains %s is NOT turned into a conflict rule', async (rule) => {
    vi.mocked(http.put).mockRejectedValueOnce(new HttpError(409, 'Conflict', envelope('conflict', `conflict: ${rule}: no`, [])))
    const error = await adapter.answerItem(ATTEMPT_ID, 0, { selected: [], flagged: false }).catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(ExamsConflictError)
  })

  it.each(['invalid_text', 'range'])('a 422 whose code names %s is an ExamsValidationError carrying that rule', async (rule) => {
    vi.mocked(http.put).mockRejectedValueOnce(new HttpError(422, 'Unprocessable', envelope(rule, 'bad value', [])))
    const error = (await adapter.answerItem(ATTEMPT_ID, 0, { selected: [], flagged: false }).catch((e: unknown) => e)) as ExamsValidationError
    expect(error).toBeInstanceOf(ExamsValidationError)
    expect(error.details.map((d) => d.rule)).toEqual([rule])
  })

  it.each(['invalid_text', 'range'])('a 422 without details whose message contains the word %s is NOT turned into a validation error', async (rule) => {
    vi.mocked(http.put).mockRejectedValueOnce(new HttpError(422, 'Unprocessable', envelope('unprocessable', `value out of ${rule} for the field`, [])))
    const error = await adapter.answerItem(ATTEMPT_ID, 0, { selected: [], flagged: false }).catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(ExamsValidationError)
  })

  it('an unrelated 409 without details stays a plain Error', async () => {
    vi.mocked(http.put).mockRejectedValue(new HttpError(409, 'Conflict', envelope('conflict', 'something else', [])))
    const error = await adapter.answerItem(ATTEMPT_ID, 0, { selected: [], flagged: false }).catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(ExamsConflictError)
  })
})
