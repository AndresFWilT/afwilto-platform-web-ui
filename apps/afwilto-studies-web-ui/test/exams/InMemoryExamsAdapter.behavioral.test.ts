import { describe, it, expect } from 'vitest'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { ExamsAttemptInProgressError, ExamsConflictError, ExamsNotFoundError, ExamsValidationError } from '../../src/exams/application/ports'
import type { Attempt, SessionConfig } from '../../src/exams/domain'
import { EXAM_ID } from './examFixtures'
import { DOM, SERVICE, TestClock, bigSeed, simpleQuestion } from './attemptFixtures'

// The same draw, deadline and scoring rules as the backend (AC-14/16/19/20, slices 06a/06b), so the
// offline `pnpm dev` behaves like production.
const T0 = Date.parse('2026-10-23T10:00:00.000Z')
const SIMULATION: SessionConfig = { selection: { kind: 'simulation' } }
const random = (count: number, extra: Partial<SessionConfig> = {}): SessionConfig => ({
  selection: { kind: 'random', count },
  timing: { kind: 'untimed' },
  feedback: 'end',
  ...extra,
})
const vpcAndLambda = (count: number | 'all', extra: Partial<SessionConfig> = {}): SessionConfig => ({
  selection: { kind: 'categories', classificationId: SERVICE.classification, categoryIds: [SERVICE.vpc, SERVICE.lambda], count },
  timing: { kind: 'untimed' },
  feedback: 'end',
  ...extra,
})

function setup(seedOverrides = {}, perDomain: Partial<Record<string, number>> = {}) {
  const clock = new TestClock()
  const service = new InMemoryExamsAdapter(bigSeed(seedOverrides, perDomain), { now: clock.now })
  return { clock, service }
}
const failure = (promise: Promise<unknown>) => promise.catch((e: unknown) => e)

/** The correct labels of every item of the attempt a seed draws: starts it, submits it empty and reads the review. */
async function answerKey(service: InMemoryExamsAdapter, config: SessionConfig, seed: number): Promise<string[][]> {
  const attempt = await service.startAttempt(EXAM_ID, config, seed)
  await service.submitAttempt(attempt.id)
  return (await service.getAttemptReport(attempt.id)).review.map((r) => r.reveal.correctLabels)
}

const totals = (report: Awaited<ReturnType<InMemoryExamsAdapter['getAttemptReport']>>, classification: string) =>
  Object.fromEntries((report.result.breakdown.find((b) => b.classification === classification)?.categories ?? []).map((c) => [c.name, c.total]))

describe('previewSession (FR-7, FR-8; S06a-1, S06a-2)', () => {
  it('a simulation previews the exam count and the exam time (S06a-1)', async () => {
    const { service } = setup()
    expect(await service.previewSession(EXAM_ID, SIMULATION)).toEqual({ poolSize: 160, drawCount: 65, suggestedMinutes: 130, shortages: [] })
  })

  it('categories VPC + Lambda with "todas": 10 × 2 + 4 × 2.5 = 30 minutes (AC-16, first case)', async () => {
    const { service } = setup()
    expect(await service.previewSession(EXAM_ID, vpcAndLambda('all'))).toEqual({ poolSize: 14, drawCount: 14, suggestedMinutes: 30, shortages: [] })
  })

  it('categories with N = 7 estimates ceil(N × the mean pace of the pool) = 15 minutes', async () => {
    const { service } = setup()
    expect(await service.previewSession(EXAM_ID, vpcAndLambda(7))).toMatchObject({ poolSize: 14, drawCount: 7, suggestedMinutes: 15 })
  })

  it('adding S3 (6 questions at the exam pace of 2 min) raises the suggestion to 42', async () => {
    const { service } = setup()
    const config: SessionConfig = {
      selection: { kind: 'categories', classificationId: SERVICE.classification, categoryIds: [SERVICE.vpc, SERVICE.lambda, SERVICE.s3], count: 'all' },
      timing: { kind: 'untimed' },
      feedback: 'end',
    }
    expect(await service.previewSession(EXAM_ID, config)).toMatchObject({ poolSize: 20, suggestedMinutes: 42 })
  })

  it('random draws min(N, pool) at the exam pace of the primary classification', async () => {
    const { service } = setup()
    expect(await service.previewSession(EXAM_ID, random(40))).toMatchObject({ poolSize: 165, drawCount: 40, suggestedMinutes: 80 })
    expect(await service.previewSession(EXAM_ID, random(200))).toMatchObject({ drawCount: 165 })
  })

  it('origin-set takes the whole set; an unknown set is an empty pool', async () => {
    const questions = [
      simpleQuestion('t1', 0, [], { origin: { set: 'TD Timed Set 3', number: 2 } }),
      simpleQuestion('t2', 1, [], { origin: { set: 'TD Timed Set 3', number: 1 } }),
      simpleQuestion('o1', 2, [], { origin: { set: 'Other', number: 1 } }),
    ]
    const { service } = setup({ questions })
    const config = (set: string): SessionConfig => ({ selection: { kind: 'origin-set', set }, timing: { kind: 'untimed' }, feedback: 'end' })
    expect(await service.previewSession(EXAM_ID, config('TD Timed Set 3'))).toMatchObject({ poolSize: 2, drawCount: 2, suggestedMinutes: 4 })
    expect(await service.previewSession(EXAM_ID, config('Nope'))).toMatchObject({ poolSize: 0, drawCount: 0, suggestedMinutes: 0 })
  })

  it('lists the categories whose questions are fewer than their simulation quota (S09-2)', async () => {
    const { service } = setup({}, { [DOM.seguridad]: 12 })
    expect((await service.previewSession(EXAM_ID, SIMULATION)).shortages).toEqual([{ category: 'Seguridad', needed: 19, available: 12 }])
  })

  it('a simulation that also sends timing or feedback is rejected: locked_by_simulation (S06a-5)', async () => {
    const { service } = setup()
    const error = await failure(service.previewSession(EXAM_ID, { ...SIMULATION, timing: { kind: 'untimed' } }))
    expect(error).toBeInstanceOf(ExamsValidationError)
    expect((error as ExamsValidationError).details[0].rule).toBe('locked_by_simulation')
  })

  it('an unknown exam is an ExamsNotFoundError', async () => {
    expect(await failure(setup().service.previewSession('nope', SIMULATION))).toBeInstanceOf(ExamsNotFoundError)
  })
})

describe('startAttempt: the draw (FR-9; AC-14, AC-15, AC-17, AC-21)', () => {
  it('a simulation draws 19 / 17 / 16 / 13 by primary weight, never an unclassified question, timed 130 min (AC-14)', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, SIMULATION, 11)
    expect(attempt.items).toHaveLength(65)
    expect(attempt.suggestedMinutes).toBe(130)
    expect(attempt.remainingSeconds).toBe(130 * 60)
    expect(attempt.deadlineAt).toBe(new Date(T0 + 130 * 60_000).toISOString())
    await service.submitAttempt(attempt.id)
    const report = await service.getAttemptReport(attempt.id)
    expect(totals(report, 'Dominio')).toEqual({ Seguridad: 19, Rendimiento: 17, Resiliencia: 16, Costos: 13 })
  })

  it('a simulation with a category short of its quota fails with insufficient_questions {category, needed, available} (AC-15)', async () => {
    const { service } = setup({}, { [DOM.seguridad]: 12 })
    const error = (await failure(service.startAttempt(EXAM_ID, SIMULATION, 1))) as ExamsValidationError
    expect(error).toBeInstanceOf(ExamsValidationError)
    expect(error.details).toEqual([expect.objectContaining({ rule: 'insufficient_questions', category: 'Seguridad', needed: 19, available: 12 })])
    expect(await service.listAttempts(EXAM_ID)).toEqual({ attempts: [], trend: [] })
  })

  it('categories with N = 7: the start suggests ceil(Σ pace of the drawn questions) (AC-16, second case)', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, vpcAndLambda(7), 5)
    expect(attempt.items).toHaveLength(7)
    await service.submitAttempt(attempt.id)
    const drawn = totals(await service.getAttemptReport(attempt.id), 'Servicio')
    expect(attempt.suggestedMinutes).toBe(Math.ceil((drawn['VPC'] ?? 0) * 2 + (drawn['Lambda'] ?? 0) * 2.5))
  })

  it('the same seed on an unchanged bank repeats the questions and the option order (AC-17)', async () => {
    const { service } = setup()
    const shape = (a: Attempt) => a.items.map((i) => [i.stem, ...i.options.map((o) => o.text)])
    const first = await service.startAttempt(EXAM_ID, random(30), 42)
    await service.submitAttempt(first.id)
    const second = await service.startAttempt(EXAM_ID, random(30), 42)
    await service.submitAttempt(second.id)
    const other = await service.startAttempt(EXAM_ID, random(30), 43)
    expect(shape(second)).toEqual(shape(first))
    expect(shape(other)).not.toEqual(shape(first))
  })

  it('options are shuffled and relabelled A, B, C… in the displayed order', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(20), 3)
    for (const item of attempt.items) expect(item.options.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D'])
    const texts = attempt.items.map((i) => i.options.map((o) => o.text!.slice(0, 8)).join('|'))
    expect(new Set(texts).size).toBeGreaterThan(1)
    expect(attempt.items.some((i) => i.options[0].text!.startsWith('Opción A') === false)).toBe(true)
  })

  it('origin-set keeps origin.number order; an empty set is insufficient_questions (AC-21)', async () => {
    const questions = [3, 1, 2].map((n) => simpleQuestion(`t${n}`, n, [], { stem: `Set 3 número ${n}`, origin: { set: 'TD Timed Set 3', number: n } }))
    const { service } = setup({ questions })
    const config = (set: string): SessionConfig => ({ selection: { kind: 'origin-set', set }, timing: { kind: 'untimed' }, feedback: 'end' })
    const attempt = await service.startAttempt(EXAM_ID, config('TD Timed Set 3'), 99)
    expect(attempt.items.map((i) => i.stem)).toEqual(['Set 3 número 1', 'Set 3 número 2', 'Set 3 número 3'])
    await service.submitAttempt(attempt.id)
    const error = (await failure(service.startAttempt(EXAM_ID, config('Nope')))) as ExamsValidationError
    expect(error.details[0].rule).toBe('insufficient_questions')
  })

  it('a multi question carries chooseCount N; a single one carries none (S06a-7)', async () => {
    const multi = simpleQuestion('m1', 0, [], {
      type: 'multi',
      options: ['A', 'B', 'C', 'D'].map((label, i) => ({ label, text: `m ${label}`, correct: i === 1 || i === 3 })),
    })
    const { service } = setup({ questions: [multi, simpleQuestion('s1', 1, [])] })
    const attempt = await service.startAttempt(EXAM_ID, random(2), 8)
    const byType = Object.fromEntries(attempt.items.map((i) => [i.type, i]))
    expect(byType['multi'].chooseCount).toBe(2)
    expect(byType['single']).not.toHaveProperty('chooseCount')
  })

  it('the start response holds no correct flag, rationale or explanation at any depth (S06a-4)', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(10), 1)
    const keys = new Set<string>()
    const walk = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(walk)
      else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => (keys.add(k), walk(v)))
    }
    walk(attempt)
    for (const forbidden of ['correct', 'correctLabels', 'rationale', 'rationales', 'explanation', 'reveal']) expect(keys.has(forbidden)).toBe(false)
  })

  it('only one attempt per exam may be in progress: a second start is ExamsAttemptInProgressError with the id (BR-A1)', async () => {
    const { service } = setup()
    const first = await service.startAttempt(EXAM_ID, random(5), 1)
    const error = await failure(service.startAttempt(EXAM_ID, random(5), 2))
    expect(error).toBeInstanceOf(ExamsAttemptInProgressError)
    expect((error as ExamsAttemptInProgressError).attemptId).toBe(first.id)
    await service.submitAttempt(first.id)
    expect((await service.startAttempt(EXAM_ID, random(5), 2)).id).not.toBe(first.id)
  })

  it('a timed custom session sets the deadline from its minutes; untimed has none', async () => {
    const { service } = setup()
    const timed = await service.startAttempt(EXAM_ID, random(5, { timing: { kind: 'timed', minutes: 45 } }), 1)
    expect(timed.remainingSeconds).toBe(45 * 60)
    await service.submitAttempt(timed.id)
    const untimed = await service.startAttempt(EXAM_ID, random(5), 1)
    expect(untimed).not.toHaveProperty('deadlineAt')
    expect(untimed).not.toHaveProperty('remainingSeconds')
  })
})

describe('answerItem: saving, feedback and locking (FR-10; AC-18, S06b-2, S06b-3)', () => {
  it('under feedback "end" the answer comes back as {position, selected, flagged} only (AC-18)', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(3), 1)
    expect(await service.answerItem(attempt.id, 1, { selected: ['B'], flagged: true })).toEqual({ position: 1, selected: ['B'], flagged: true })
  })

  it('getAttempt restores the answers and flags, and still reveals nothing under "end"', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(3), 1)
    await service.answerItem(attempt.id, 0, { selected: ['C'], flagged: false })
    await service.answerItem(attempt.id, 2, { selected: [], flagged: true })
    const again = await service.getAttempt(attempt.id)
    expect(again.items.map((i) => [i.selected, i.flagged, i.answered])).toEqual([[['C'], false, true], [[], false, false], [[], true, false]])
    expect(again.items.every((i) => i.reveal === undefined)).toBe(true)
  })

  it('answers can be changed until the attempt closes', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(2), 1)
    await service.answerItem(attempt.id, 0, { selected: ['A'], flagged: false })
    await service.answerItem(attempt.id, 0, { selected: ['B'], flagged: false })
    expect((await service.getAttempt(attempt.id)).items[0].selected).toEqual(['B'])
  })

  it('under feedback "each" the first non-empty answer reveals and locks; flagging still works (S06b-2, D-13)', async () => {
    const { service } = setup()
    const config = random(3, { feedback: 'each' })
    const key = await answerKey(service, config, 21)
    const wrong = ['A', 'B', 'C', 'D'].find((l) => l !== key[0][0])!
    const attempt = await service.startAttempt(EXAM_ID, config, 21)
    const outcome = await service.answerItem(attempt.id, 0, { selected: [wrong], flagged: false })
    expect(outcome.reveal).toMatchObject({ correct: false, correctLabels: key[0] })
    expect(outcome.reveal?.rationales[key[0][0]]).toMatch(/^Racional /)
    expect(outcome.reveal?.explanation).toMatch(/^Explicación /)
    const locked = await failure(service.answerItem(attempt.id, 0, { selected: key[0], flagged: false }))
    expect(locked).toBeInstanceOf(ExamsConflictError)
    expect((locked as ExamsConflictError).rule).toBe('answer_locked')
    const flagged = await service.answerItem(attempt.id, 0, { selected: [wrong], flagged: true })
    expect(flagged).toMatchObject({ selected: [wrong], flagged: true })
    expect(flagged.reveal?.correct).toBe(false)
    const restored = (await service.getAttempt(attempt.id)).items[0]
    expect(restored.reveal).toMatchObject({ correct: false, correctLabels: key[0] })
    expect((await service.getAttempt(attempt.id)).items[1].reveal).toBeUndefined()
  })

  it('an empty selection under "each" does not reveal', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(2, { feedback: 'each' }), 1)
    expect((await service.answerItem(attempt.id, 0, { selected: [], flagged: true })).reveal).toBeUndefined()
  })

  it('a label the item does not show, or a repeated label, is invalid_label (S06b-3)', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(2), 1)
    for (const selected of [['Z'], ['A', 'A']]) {
      const error = (await failure(service.answerItem(attempt.id, 0, { selected, flagged: false }))) as ExamsValidationError
      expect(error).toBeInstanceOf(ExamsValidationError)
      expect(error.details[0].rule).toBe('invalid_label')
    }
  })

  it('a single question takes at most 1 label; a position outside the attempt is not found', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(2), 1)
    const error = (await failure(service.answerItem(attempt.id, 0, { selected: ['A', 'B'], flagged: false }))) as ExamsValidationError
    expect(error.details[0].rule).toBe('too_many_selected')
    expect(await failure(service.answerItem(attempt.id, 9, { selected: [], flagged: false }))).toBeInstanceOf(ExamsNotFoundError)
    expect(await failure(service.answerItem('nope', 0, { selected: [], flagged: false }))).toBeInstanceOf(ExamsNotFoundError)
  })
})

describe('multi scoring (AC-20)', () => {
  const multi = simpleQuestion('m1', 0, [], {
    type: 'multi',
    options: ['A', 'B', 'C', 'D', 'E'].map((label, i) => ({ label, text: `m ${label}`, correct: i === 1 || i === 3 })),
  })

  async function score(selectedFor: (key: string[], wrong: string[]) => string[]): Promise<number | ExamsValidationError> {
    const { service } = setup({ questions: [multi] })
    const config = random(1)
    const key = (await answerKey(service, config, 4))[0]
    const wrong = ['A', 'B', 'C', 'D', 'E'].filter((l) => !key.includes(l))
    const attempt = await service.startAttempt(EXAM_ID, config, 4)
    try {
      await service.answerItem(attempt.id, 0, { selected: selectedFor(key, wrong), flagged: false })
    } catch (e) {
      return e as ExamsValidationError
    }
    return (await service.submitAttempt(attempt.id)).correctCount
  }

  it('the same set in either order is right', async () => {
    expect(await score((key) => key)).toBe(1)
    expect(await score((key) => [...key].reverse())).toBe(1)
  })

  it('a subset, a different set and an empty answer are wrong', async () => {
    expect(await score((key) => [key[0]])).toBe(0)
    expect(await score((key, wrong) => [key[0], wrong[0]])).toBe(0)
    expect(await score(() => [])).toBe(0)
  })

  it('more labels than N are rejected: too_many_selected', async () => {
    const result = await score((key, wrong) => [...key, wrong[0]])
    expect(result).toBeInstanceOf(ExamsValidationError)
    expect((result as ExamsValidationError).details[0].rule).toBe('too_many_selected')
  })
})

describe('the deadline and lazy expiry (AC-19, S06b-1, S06b-8)', () => {
  const timed = random(3, { timing: { kind: 'timed', minutes: 5 } })

  it('remainingSeconds follows the clock: 10 s before, 0 and still open 3 s after, expired and scored 6 s after (S06b-1)', async () => {
    const { clock, service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, timed, 1)
    const deadline = T0 + 300_000
    clock.set(deadline - 10_000)
    expect(await service.getAttempt(attempt.id)).toMatchObject({ status: 'in_progress', remainingSeconds: 10 })
    clock.set(deadline + 3_000)
    expect(await service.getAttempt(attempt.id)).toMatchObject({ status: 'in_progress', remainingSeconds: 0 })
    clock.set(deadline + 6_000)
    expect(await service.getAttempt(attempt.id)).toMatchObject({ status: 'expired', remainingSeconds: 0 })
    expect((await service.getAttemptReport(attempt.id)).result.scorePercent).toBe(0)
  })

  it('rounds the remaining time up to whole seconds', async () => {
    const { clock, service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, timed, 1)
    clock.set(T0 + 300_000 - 9_500)
    expect((await service.getAttempt(attempt.id)).remainingSeconds).toBe(10)
  })

  it('a write 4 s after the deadline still saves; 6 s after it is attempt_expired and the attempt is scored (AC-19)', async () => {
    const { clock, service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, timed, 1)
    const deadline = T0 + 300_000
    clock.set(deadline + 4_000)
    expect(await service.answerItem(attempt.id, 0, { selected: ['A'], flagged: false })).toMatchObject({ selected: ['A'] })
    clock.set(deadline + 6_000)
    const error = await failure(service.answerItem(attempt.id, 1, { selected: ['A'], flagged: false }))
    expect(error).toBeInstanceOf(ExamsConflictError)
    expect((error as ExamsConflictError).rule).toBe('attempt_expired')
    expect((await service.getAttempt(attempt.id)).status).toBe('expired')
    const report = await service.getAttemptReport(attempt.id)
    expect(report.result.total).toBe(3)
    expect(report.review[0].selected).toEqual(['A'])
    expect(report.review[1].selected).toEqual([])
  })

  it('a later write on an attempt already expired is attempt_closed; submitting it too (S06b-8)', async () => {
    const { clock, service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, timed, 1)
    clock.set(T0 + 300_000 + 6_000)
    await service.getAttempt(attempt.id)
    const write = (await failure(service.answerItem(attempt.id, 0, { selected: ['A'], flagged: false }))) as ExamsConflictError
    expect(write.rule).toBe('attempt_closed')
    const submit = (await failure(service.submitAttempt(attempt.id))) as ExamsConflictError
    expect(submit.rule).toBe('attempt_closed')
  })

  it('submitting after the grace period expires the attempt first, so that submit is attempt_closed too', async () => {
    const { clock, service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, timed, 1)
    clock.set(T0 + 300_000 + 6_000)
    expect(((await failure(service.submitAttempt(attempt.id))) as ExamsConflictError).rule).toBe('attempt_expired')
    expect((await service.getAttempt(attempt.id)).status).toBe('expired')
  })
})

describe('submitAttempt and the report (FR-10; S06b-4, S06b-5)', () => {
  it('scores correct / total with unanswered items wrong: 2 right of 4 with 3 answered is 50 %; a practice attempt has passed null (S06b-4)', async () => {
    const { clock, service } = setup()
    const config = random(4)
    const key = await answerKey(service, config, 9)
    const attempt = await service.startAttempt(EXAM_ID, config, 9)
    const wrong = (l: string) => ['A', 'B', 'C', 'D'].find((x) => x !== l)!
    await service.answerItem(attempt.id, 0, { selected: key[0], flagged: false })
    await service.answerItem(attempt.id, 1, { selected: key[1], flagged: true })
    await service.answerItem(attempt.id, 2, { selected: [wrong(key[2][0])], flagged: false })
    clock.advance(90)
    const result = await service.submitAttempt(attempt.id)
    expect(result).toMatchObject({ scorePercent: 50, passed: null, correctCount: 2, total: 4, durationSeconds: 90 })
    const report = await service.getAttemptReport(attempt.id)
    expect(report.selectionKind).toBe('random')
    expect(report.result).toEqual(result)
    expect(report.review.map((r) => r.reveal.correct)).toEqual([true, true, false, false])
    expect(report.review[1].flagged).toBe(true)
  })

  it('a simulation passes at the exam pass mark: 47 of 65 is 72.31 % (passed), 46 is 70.77 % (not passed)', async () => {
    for (const [rightCount, passed, score] of [[47, true, 72.31], [46, false, 70.77]] as const) {
      const { service } = setup()
      const key = await answerKey(service, SIMULATION, 13)
      const attempt = await service.startAttempt(EXAM_ID, SIMULATION, 13)
      for (let i = 0; i < rightCount; i++) await service.answerItem(attempt.id, i, { selected: key[i], flagged: false })
      expect(await service.submitAttempt(attempt.id)).toMatchObject({ scorePercent: score, passed, correctCount: rightCount, total: 65 })
    }
  })

  it('the review gives every item its snapshot, the selection, the key, rationales, explanation and categories', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(2), 5)
    await service.answerItem(attempt.id, 0, { selected: ['A'], flagged: false })
    await service.submitAttempt(attempt.id)
    const [first] = (await service.getAttemptReport(attempt.id)).review
    expect(first).toMatchObject({ position: 0, selected: ['A'], flagged: false })
    expect(first.options).toHaveLength(4)
    expect(first.reveal.correctLabels).toHaveLength(1)
    expect(first.reveal.explanation).toMatch(/^Explicación/)
    expect(first.categories.length).toBeGreaterThanOrEqual(0)
  })

  it('reviewing an open attempt is ExamsAttemptInProgressError', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(2), 5)
    expect(await failure(service.getAttemptReport(attempt.id))).toBeInstanceOf(ExamsAttemptInProgressError)
  })

  it('submitting twice is attempt_closed', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(2), 5)
    await service.submitAttempt(attempt.id)
    expect(((await failure(service.submitAttempt(attempt.id))) as ExamsConflictError).rule).toBe('attempt_closed')
  })

  it('links noteId when the origin noteRef, without its "(diap. …)" suffix, is the title of a seeded note (S06b-6)', async () => {
    const withNote = simpleQuestion('n1', 0, [], { origin: { noteRef: '03 · Route 53 (diap. 12)' } })
    const orphan = simpleQuestion('n2', 1, [], { origin: { noteRef: '99 · Borrada' } })
    const { service } = setup({ questions: [withNote, orphan], notes: { '03 · Route 53': 'note-53' } })
    const attempt = await service.startAttempt(EXAM_ID, random(2), 5)
    await service.submitAttempt(attempt.id)
    const review = (await service.getAttemptReport(attempt.id)).review
    expect(review.map((r) => r.noteId)).toEqual(expect.arrayContaining(['note-53', undefined]))
    expect(review.filter((r) => r.noteId).length).toBe(1)
  })

  it('a started attempt is a snapshot: deleting its questions afterwards changes nothing (AC-8)', async () => {
    const { service } = setup()
    const attempt = await service.startAttempt(EXAM_ID, random(3), 5)
    for (const q of await service.listQuestions(EXAM_ID)) await service.deleteQuestion(q.id)
    expect((await service.getAttempt(attempt.id)).items).toHaveLength(3)
    await service.submitAttempt(attempt.id)
    expect((await service.getAttemptReport(attempt.id)).review[0].stem).toMatch(/^Pregunta /)
  })
})

describe('listAttempts with real attempts (S06b-7)', () => {
  it('lists newest first with their kinds; the trend holds closed simulations only, oldest first (D-11)', async () => {
    const { clock, service } = setup()
    const run = async (config: SessionConfig, seed: number) => {
      const attempt = await service.startAttempt(EXAM_ID, config, seed)
      clock.advance(60)
      await service.submitAttempt(attempt.id)
      clock.advance(60)
      return attempt.id
    }
    const sim1 = await run(SIMULATION, 1)
    const practice = await run(random(5), 2)
    const sim2 = await run(SIMULATION, 3)
    const open = await service.startAttempt(EXAM_ID, random(2, { feedback: 'each' }), 4)

    const history = await service.listAttempts(EXAM_ID)
    expect(history.attempts.map((a) => a.id)).toEqual([open.id, sim2, practice, sim1])
    expect(history.attempts[0]).toMatchObject({ selectionKind: 'random', timingKind: 'untimed', feedback: 'each', status: 'in_progress' })
    expect(history.attempts[0]).not.toHaveProperty('scorePercent')
    expect(history.attempts[1]).toMatchObject({ selectionKind: 'simulation', timingKind: 'timed', feedback: 'end', status: 'submitted', durationSeconds: 60, scorePercent: 0, passed: false })
    expect(history.attempts[2]).not.toHaveProperty('passed')
    expect(history.trend.map((p) => p.scorePercent)).toEqual([0, 0])
    expect(history.trend[0].at < history.trend[1].at).toBe(true)
  })

  it('the exam summary reports the latest closed simulation as lastSimulation', async () => {
    const { service } = setup()
    expect((await service.listExams('00000000-0000-7000-8000-0000000000a1'))[0].lastSimulation).toBeUndefined()
    const attempt = await service.startAttempt(EXAM_ID, SIMULATION, 1)
    await service.submitAttempt(attempt.id)
    expect((await service.listExams('00000000-0000-7000-8000-0000000000a1'))[0].lastSimulation).toMatchObject({ scorePercent: 0, passed: false })
  })
})
