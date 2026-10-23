import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { currentLocation, renderAt } from '../support/renderStudies'
import { findDialog } from '../support/forms'
import { CAT, EXAM_ID, SUBJECT_ID, examFixture, examsSeedFixture } from './examFixtures'

const URL = `/studies/exams/${EXAM_ID}`
const service = (overrides = {}) => new InMemoryExamsAdapter(examsSeedFixture(overrides))
const open = (exams = service()) => {
  renderAt(URL, undefined, exams)
  return exams
}
const inferredExam = () => {
  const exam = examFixture()
  exam.classifications[0].weightMode = 'inferred'
  return exam
}
const sectionOf = async (name: string) => within(await screen.findByRole('region', { name }))

afterEach(() => vi.restoreAllMocks())

describe('ExamOverviewPage: parameters and classifications (S08-7)', () => {
  it('shows the exam name and its real-simulation parameters', async () => {
    open()
    expect(await screen.findByRole('heading', { level: 1, name: 'SAA-C03' })).toBeTruthy()
    expect(screen.getByText('65 preguntas · 130 min · aprobado con 72 %')).toBeTruthy()
    expect(screen.getByText('13 preguntas en el banco')).toBeTruthy()
  })

  it('marks each primary weight "manual" when the weights were set by hand (S08-7)', async () => {
    open()
    const dominio = await sectionOf('Dominio')
    for (const [name, weight] of [['Seguridad', '40 %'], ['Rendimiento', '40 %'], ['Costos', '20 %']]) {
      const row = dominio.getByText(name).closest('li')!
      expect(within(row).getByText(weight)).toBeTruthy()
      expect(within(row).getByText('manual')).toBeTruthy()
      expect(within(row).queryByText('inferido')).toBeNull()
    }
  })

  it('marks each primary weight "inferido" when they come from the bank (S08-7)', async () => {
    open(service({ exams: [inferredExam()] }))
    const dominio = await sectionOf('Dominio')
    const row = dominio.getByText('Seguridad').closest('li')!
    expect(within(row).getByText('50 %')).toBeTruthy()
    expect(within(row).getByText('inferido')).toBeTruthy()
    expect(within(row).queryByText('manual')).toBeNull()
  })

  it('shows "3 sin clasificar" when three questions have no primary category (S08-7)', async () => {
    open()
    expect(await screen.findByText('3 sin clasificar')).toBeTruthy()
  })

  it('hides the unclassified line when every question is classified', async () => {
    open(service({ questions: [], exams: [examFixture()] }))
    await screen.findByRole('heading', { level: 1, name: 'SAA-C03' })
    expect(screen.queryByText(/sin clasificar/)).toBeNull()
  })

  it('lists the question count of every category; only the primary classification has weights', async () => {
    open()
    const servicio = await sectionOf('Servicio')
    const row = servicio.getByText('Amazon S3').closest('li')!
    expect(within(row).getByText('5 preguntas')).toBeTruthy()
    expect(within(row).queryByText(/%/)).toBeNull()
    expect(servicio.queryByText('manual')).toBeNull()
    const dominio = await sectionOf('Dominio')
    expect(within(dominio.getByText('Seguridad').closest('li')!).getByText('5 preguntas')).toBeTruthy()
    expect(dominio.getByText('Principal')).toBeTruthy()
  })

  it('shows a category pace as questions / minutes, or the exam pace when it has none', async () => {
    const exams = service()
    await exams.updateExam(EXAM_ID, { version: 1, categories: [{ id: CAT.vpc, paceQuestions: 10, paceMinutes: 20 }] })
    open(exams)
    const servicio = await sectionOf('Servicio')
    expect(within(servicio.getByText('VPC').closest('li')!).getByText('10 preguntas / 20 min')).toBeTruthy()
    expect(within(servicio.getByText('Amazon S3').closest('li')!).getByText('2 min por pregunta (del examen)')).toBeTruthy()
  })

  it('says how to get classifications when the exam has none', async () => {
    open(service({ exams: [examFixture({ classifications: [] })], questions: [] }))
    expect(await screen.findByText('Aún no hay clasificaciones. Importa preguntas para inferirlas.')).toBeTruthy()
  })

  it('an unknown exam says so', async () => {
    renderAt(`/studies/exams/${'0'.repeat(8)}`, undefined, service())
    expect(await screen.findByText('Examen no encontrado')).toBeTruthy()
  })
})

describe('ExamOverviewPage: actions', () => {
  it('links to import, bank, edit and a new simulation', async () => {
    open()
    await screen.findByRole('heading', { level: 1, name: 'SAA-C03' })
    const href = (name: string) => screen.getByRole('link', { name }).getAttribute('href')
    expect(href('Importar')).toBe(`/studies/exams/${EXAM_ID}/import`)
    expect(href('Banco')).toBe(`/studies/exams/${EXAM_ID}/questions`)
    expect(href('Editar')).toBe(`/studies/exams/${EXAM_ID}/edit`)
    expect(href('Nuevo simulacro')).toBe(`/studies/exams/${EXAM_ID}/start`)
  })

  it('Exportar is an anchor to the adapter export URL and fetches nothing (S08-8)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const exams = open()
    const link = await screen.findByRole('link', { name: 'Exportar' })
    expect(link.getAttribute('href')).toBe(exams.exportUrl(EXAM_ID))
    expect(link.hasAttribute('download')).toBe(true)
    fireEvent.click(link)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('Eliminar asks for confirmation naming the exam, and Cancelar changes nothing', async () => {
    const exams = open()
    const del = vi.spyOn(exams, 'deleteExam')
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    const dialog = await findDialog('¿Eliminar el examen «SAA-C03»?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(del).not.toHaveBeenCalled()
  })

  it('an exam with questions cannot be deleted: the dialog explains and the exam stays', async () => {
    open()
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    const dialog = await findDialog('¿Eliminar el examen «SAA-C03»?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar examen' }))
    expect(await within(dialog).findByText('No se puede eliminar: el examen aún tiene preguntas. Elimínalas primero.')).toBeTruthy()
    expect(currentLocation()).toBe(URL)
  })

  it('an exam without questions is deleted: toast, then back to the subject exams', async () => {
    const exams = open(service({ questions: [] }))
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    const dialog = await findDialog('¿Eliminar el examen «SAA-C03»?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar examen' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/subjects/${SUBJECT_ID}/exams`))
    expect(await screen.findByText('Examen eliminado')).toBeTruthy()
    expect(await exams.listExams(SUBJECT_ID)).toEqual([])
  })
})

describe('ExamOverviewPage: history and trend', () => {
  const attempts = {
    [EXAM_ID]: {
      attempts: [
        { id: 'a3', selectionKind: 'simulation' as const, timingKind: 'timed' as const, feedback: 'end' as const, status: 'submitted' as const, startedAt: '2026-10-22T10:00:00Z', durationSeconds: 3000, scorePercent: 78.5, passed: true },
        { id: 'a2', selectionKind: 'random' as const, timingKind: 'untimed' as const, feedback: 'each' as const, status: 'submitted' as const, startedAt: '2026-10-21T10:00:00Z', durationSeconds: 1200, scorePercent: 55 },
        { id: 'a1', selectionKind: 'simulation' as const, timingKind: 'timed' as const, feedback: 'end' as const, status: 'in_progress' as const, startedAt: '2026-10-20T10:00:00Z' },
      ],
      trend: [{ at: '2026-10-15T10:00:00Z', scorePercent: 62 }, { at: '2026-10-22T10:00:00Z', scorePercent: 78.5 }],
    },
  }

  it('lists the attempts newest first with kind, score and result', async () => {
    open(service({ attempts }))
    const history = within(await screen.findByRole('region', { name: 'Historial' }))
    const rows = history.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Simulacro')).toBeTruthy()
    expect(within(rows[0]).getByText('78.5 %')).toBeTruthy()
    expect(within(rows[0]).getByText('Aprobado')).toBeTruthy()
    expect(within(rows[0]).getByText('2026-10-22')).toBeTruthy()
    expect(within(rows[0]).getByText('50 min')).toBeTruthy()
    expect(within(rows[1]).getByText('Aleatorio')).toBeTruthy()
    expect(within(rows[1]).getByText('55 %')).toBeTruthy()
    expect(within(rows[1]).queryByText('Aprobado')).toBeNull()
    expect(within(rows[2]).getByText('En curso')).toBeTruthy()
  })

  it('shows the simulation-only trend as a list of scores, oldest first', async () => {
    open(service({ attempts }))
    const trend = within(await screen.findByRole('list', { name: 'Tendencia de simulacros' }))
    expect(trend.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['2026-10-15 · 62 %', '2026-10-22 · 78.5 %'])
  })

  it('says there are no attempts yet, and shows no trend', async () => {
    open()
    expect(await screen.findByText('Aún no hay intentos')).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Tendencia de simulacros' })).toBeNull()
  })
})
