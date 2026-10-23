import { describe, it, expect, afterEach, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import type { SessionConfig } from '../../src/exams/domain'
import { renderAt } from '../support/renderStudies'
import { EXAM_ID } from './examFixtures'
import { TestClock, bigSeed, simpleQuestion } from './attemptFixtures'

const random = (count: number, extra: Partial<SessionConfig> = {}): SessionConfig => ({ selection: { kind: 'random', count }, timing: { kind: 'untimed' }, feedback: 'end', ...extra })
const SIMULATION: SessionConfig = { selection: { kind: 'simulation' } }

const D = (name: string): [string, string] => ['Dominio', name]
/** Six questions: q1–q3 Seguridad, q4–q6 Costos; q2 points at a note. */
const smallBank = () => [
  simpleQuestion('q1', 0, [D('Seguridad')]),
  simpleQuestion('q2', 1, [D('Seguridad')], { origin: { noteRef: '03 · Route 53 (diap. 12)' } }),
  simpleQuestion('q3', 2, [D('Seguridad')]),
  simpleQuestion('q4', 3, [D('Costos')]),
  simpleQuestion('q5', 0, [D('Costos')]),
  simpleQuestion('q6', 1, [D('Costos')]),
]
const NOTE_ID = '00000000-0000-7000-8000-0000000000c1'

function setup(seedOverrides = {}) {
  const clock = new TestClock()
  const exams = new InMemoryExamsAdapter(bigSeed({ questions: smallBank(), notes: { '03 · Route 53': NOTE_ID }, ...seedOverrides }), { now: clock.now })
  return { clock, exams }
}

type Plan = 'right' | 'wrong' | 'skip'

/** Plays an attempt: `plan` says what to do per question stem; the answer key comes from a throwaway attempt with the same seed. */
async function play(exams: InMemoryExamsAdapter, config: SessionConfig, plan: Record<string, Plan>, { flag = [] as string[], seed = 1, clock }: { flag?: string[]; seed?: number; clock?: TestClock } = {}) {
  const reference = await exams.startAttempt(EXAM_ID, config, seed)
  await exams.submitAttempt(reference.id)
  const key = (await exams.getAttemptReport(reference.id)).review.map((r) => r.reveal.correctLabels)
  const attempt = await exams.startAttempt(EXAM_ID, config, seed)
  for (const item of attempt.items) {
    const name = item.stem.replace('Pregunta ', '')
    const how = plan[name] ?? 'skip'
    const right = key[item.position]
    const wrong = item.options.map((o) => o.label).filter((l) => !right.includes(l))
    const selected = how === 'right' ? right : how === 'wrong' ? [wrong[0]] : []
    if (selected.length || flag.includes(name)) await exams.answerItem(attempt.id, item.position, { selected, flagged: flag.includes(name) })
  }
  clock?.advance(90)
  await exams.submitAttempt(attempt.id)
  return attempt
}

async function openResult(exams: InMemoryExamsAdapter, id: string) {
  renderAt(`/studies/attempts/${id}/result`, undefined, exams)
  await screen.findByRole('heading', { level: 1, name: 'Resultado' }, { timeout: 5000 })
}

const PLAN: Record<string, Plan> = { q1: 'right', q2: 'right', q3: 'right', q4: 'wrong', q5: 'wrong' } // q6 is skipped
const articles = () => screen.getAllByRole('article')
const stems = () => articles().map((a) => /Pregunta (q\d)/.exec(a.textContent ?? '')?.[1])

afterEach(() => vi.restoreAllMocks())

describe('ResultPage: summary (S09-9)', () => {
  it('shows the score, the count, the duration and the note that it is the raw percentage', async () => {
    const { clock, exams } = setup()
    const attempt = await play(exams, random(6), PLAN, { clock })
    await openResult(exams, attempt.id)
    expect(screen.getByText('50 %')).toBeTruthy()
    expect(screen.getByText('3 de 6 correctas')).toBeTruthy()
    expect(screen.getByText('Duración: 1 min 30 s')).toBeTruthy()
    expect(screen.getByText(/porcentaje bruto/)).toBeTruthy()
    expect(screen.getByText(/no la puntuación escalada/)).toBeTruthy()
  })

  it('the result of a random attempt shows no pass/fail (S09-9)', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), { q1: 'right', q2: 'right', q3: 'right', q4: 'right', q5: 'right', q6: 'right' })
    await openResult(exams, attempt.id)
    expect(screen.getByText('100 %')).toBeTruthy()
    expect(screen.queryByText('Aprobado')).toBeNull()
    expect(screen.queryByText('No aprobado')).toBeNull()
  })

  it('a simulation that reached the pass mark shows "Aprobado" (S09-9)', async () => {
    const exams = new InMemoryExamsAdapter(bigSeed())
    const reference = await exams.startAttempt(EXAM_ID, SIMULATION, 3)
    await exams.submitAttempt(reference.id)
    const key = (await exams.getAttemptReport(reference.id)).review.map((r) => r.reveal.correctLabels)
    const attempt = await exams.startAttempt(EXAM_ID, SIMULATION, 3)
    for (let i = 0; i < 50; i++) await exams.answerItem(attempt.id, i, { selected: key[i], flagged: false })
    await exams.submitAttempt(attempt.id)
    await openResult(exams, attempt.id)
    expect(screen.getByText('76.9 %')).toBeTruthy()
    expect(screen.getByText('Aprobado')).toBeTruthy()
    expect(screen.queryByText('No aprobado')).toBeNull()
  })

  it('a simulation below the pass mark shows "No aprobado"', async () => {
    const exams = new InMemoryExamsAdapter(bigSeed())
    const attempt = await exams.startAttempt(EXAM_ID, SIMULATION, 3)
    await exams.submitAttempt(attempt.id)
    await openResult(exams, attempt.id)
    expect(screen.getByText('No aprobado')).toBeTruthy()
    expect(screen.queryByText('Aprobado')).toBeNull()
  })

  it('"Volver al examen" goes to the exam overview', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), PLAN)
    await openResult(exams, attempt.id)
    expect(screen.getByRole('link', { name: 'Volver al examen' }).getAttribute('href')).toBe(`/studies/exams/${EXAM_ID}`)
  })
})

describe('ResultPage: breakdown', () => {
  it('lists one bar list per classification, weakest first, each with a text label "Costos 0/3 (0%)"', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), { q1: 'right', q2: 'right', q3: 'right', q4: 'wrong', q5: 'wrong' })
    await openResult(exams, attempt.id)
    const dominio = within(screen.getByRole('region', { name: 'Desglose por Dominio' }))
    const rows = dominio.getAllByRole('listitem').map((li) => li.textContent)
    expect(rows).toEqual(['Costos 0/3 (0%)', 'Seguridad 3/3 (100%)'])
  })

  it('rounds the percent to a whole number in the label', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), { q1: 'right', q2: 'right', q4: 'right' })
    await openResult(exams, attempt.id)
    const dominio = within(screen.getByRole('region', { name: 'Desglose por Dominio' }))
    expect(dominio.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Costos 1/3 (33%)', 'Seguridad 2/3 (67%)'])
  })
})

describe('ResultPage: review list (S09-10)', () => {
  it('lists "Incorrectas" by default: only the items answered wrong or not at all', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), PLAN)
    await openResult(exams, attempt.id)
    expect(screen.getByRole('button', { name: 'Incorrectas' }).getAttribute('aria-pressed')).toBe('true')
    expect(stems().sort()).toEqual(['q4', 'q5', 'q6'])
  })

  it('each item is a QuestionView in reveal mode: marks, rationale and explanation, and cannot be changed', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), PLAN)
    await openResult(exams, attempt.id)
    const first = within(articles()[0])
    expect(first.getAllByText('Correcta').length).toBeGreaterThan(0)
    expect(first.getByText('Explicación')).toBeTruthy()
    const option = articles()[0].querySelector('[role=radio]') as HTMLElement
    expect(option.getAttribute('aria-disabled')).toBe('true')
  })

  it('an item that was skipped says "Sin responder"', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), PLAN)
    await openResult(exams, attempt.id)
    const skipped = articles().find((a) => a.textContent?.includes('Pregunta q6'))!
    expect(within(skipped).getByText('Sin responder')).toBeTruthy()
    const answered = articles().find((a) => a.textContent?.includes('Pregunta q4'))!
    expect(within(answered).queryByText('Sin responder')).toBeNull()
    expect(within(answered).getByText('Tu respuesta')).toBeTruthy()
  })

  it('"Marcadas" lists the flagged items, right or wrong', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), PLAN, { flag: ['q2', 'q5'] })
    await openResult(exams, attempt.id)
    fireEvent.click(screen.getByRole('button', { name: 'Marcadas' }))
    expect(screen.getByRole('button', { name: 'Marcadas' }).getAttribute('aria-pressed')).toBe('true')
    expect(stems().sort()).toEqual(['q2', 'q5'])
    expect(within(articles()[0]).getByText('Marcada')).toBeTruthy()
  })

  it('"Todas" lists every item in position order', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), PLAN)
    await openResult(exams, attempt.id)
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))
    const labels = articles().map((a) => a.getAttribute('aria-label'))
    expect(labels).toEqual(['Pregunta 1', 'Pregunta 2', 'Pregunta 3', 'Pregunta 4', 'Pregunta 5', 'Pregunta 6'])
  })

  it('an item with a noteId has a "Ver nota" link to the note (S09-10)', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), { q1: 'right', q3: 'right' })
    await openResult(exams, attempt.id)
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))
    const links = screen.getAllByRole('link', { name: 'Ver nota' })
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe(`/studies/notes/${NOTE_ID}`)
    expect(within(links[0].closest('article')!).getByText(/Pregunta q2/)).toBeTruthy()
  })

  it('says so when a filter has nothing to show', async () => {
    const { exams } = setup()
    const attempt = await play(exams, random(6), { q1: 'right', q2: 'right', q3: 'right', q4: 'right', q5: 'right', q6: 'right' })
    await openResult(exams, attempt.id)
    expect(screen.getByText('No hay preguntas incorrectas.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Marcadas' }))
    expect(screen.getByText('No hay preguntas marcadas.')).toBeTruthy()
  })
})

describe('ResultPage: states', () => {
  it('an attempt still in progress offers to continue it', async () => {
    const { exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, random(3), 1)
    renderAt(`/studies/attempts/${attempt.id}/result`, undefined, exams)
    expect(await screen.findByText('Este simulacro sigue en curso')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Continuar' }).getAttribute('href')).toBe(`/studies/attempts/${attempt.id}`)
  })

  it('an unknown attempt says it was not found', async () => {
    renderAt('/studies/attempts/nope/result', undefined, setup().exams)
    expect(await screen.findByText('Resultado no encontrado')).toBeTruthy()
  })
})
