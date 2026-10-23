import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { currentLocation, renderAt } from '../support/renderStudies'
import { choose, findDialog } from '../support/forms'
import { CAT, EXAM_ID, examsSeedFixture } from './examFixtures'

const BASE = `/studies/exams/${EXAM_ID}/questions`
const service = (overrides = {}) => new InMemoryExamsAdapter(examsSeedFixture(overrides))
function open(exams = service(), query = '') {
  const spy = vi.spyOn(exams, 'listQuestions')
  renderAt(BASE + query, undefined, exams)
  return { exams, spy }
}
const rows = async () => within(await screen.findByRole('list', { name: 'Preguntas' })).getAllByRole('listitem')
const loaded = () => screen.findByRole('heading', { level: 1, name: 'Banco de preguntas' })
const query = () => new URLSearchParams(currentLocation().split('?')[1] ?? '')
const filterBox = (label: string) => screen.getByLabelText(label) as HTMLInputElement

afterEach(() => vi.restoreAllMocks())

describe('QuestionBankPage: listing', () => {
  it('lists the questions of the exam as summaries, with a count', async () => {
    open()
    expect(await rows()).toHaveLength(13)
    expect(screen.getByText('13 de 13 preguntas')).toBeTruthy()
    const first = (await rows())[0]
    expect(within(first).getByText('ren-1')).toBeTruthy()
    expect(within(first).getByText('Pregunta ren-1: ¿cuál opción es correcta?')).toBeTruthy()
    expect(within(first).getByText('Dominio: Rendimiento')).toBeTruthy()
    expect(within(first).getByText('Difícil')).toBeTruthy()
    expect(within(first).getByText('TD Set 1 · n.º 1')).toBeTruthy()
  })

  it('links back to the exam overview', async () => {
    open()
    expect((await screen.findByRole('link', { name: 'SAA-C03' })).getAttribute('href')).toBe(`/studies/exams/${EXAM_ID}`)
  })

  it('an empty bank invites to import', async () => {
    open(service({ questions: [] }))
    expect(await screen.findByText('Este examen aún no tiene preguntas')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Importar preguntas' }).getAttribute('href')).toBe(`/studies/exams/${EXAM_ID}/import`)
  })

  it('an unknown exam says so', async () => {
    renderAt('/studies/exams/zzzz/questions', undefined, service())
    expect(await screen.findByText('Examen no encontrado')).toBeTruthy()
  })

  it('shows the error when the bank cannot be loaded', async () => {
    const exams = service()
    exams.listQuestions = () => Promise.reject(new Error('backend unreachable'))
    renderAt(BASE, undefined, exams)
    expect(await screen.findByText('backend unreachable')).toBeTruthy()
  })
})

describe('QuestionBankPage: filters kept in the URL (S08-6)', () => {
  it('?category=<id>&q=bucket calls the adapter with both filters and shows the matches (S08-6)', async () => {
    const { spy } = open(service(), `?category=${CAT.seguridad}&q=bucket`)
    const list = await rows()
    expect(list).toHaveLength(2)
    expect(spy).toHaveBeenCalledWith(EXAM_ID, { category: CAT.seguridad, q: 'bucket' })
    expect(screen.getByText('2 de 13 preguntas')).toBeTruthy()
    expect((screen.getByLabelText('Categoría (Dominio)') as HTMLSelectElement).selectedOptions[0].textContent).toBe('Seguridad')
    expect(filterBox('Buscar en el enunciado').value).toBe('bucket')
  })

  it('the filters survive a reload: the same URL gives the same filters and results (S08-6)', async () => {
    const url = `?category=${CAT.seguridad}&q=bucket`
    open(service(), url)
    expect(await rows()).toHaveLength(2)
    cleanup()
    const { spy } = open(service(), url)
    expect(await rows()).toHaveLength(2)
    expect(spy).toHaveBeenCalledWith(EXAM_ID, { category: CAT.seguridad, q: 'bucket' })
    expect(filterBox('Buscar en el enunciado').value).toBe('bucket')
  })

  it('choosing a category writes it to the URL and filters', async () => {
    const { spy } = open()
    await loaded()
    await rows()
    choose(document.body, 'Categoría (Servicio)', 'VPC')
    await waitFor(() => expect(query().get('category')).toBe(CAT.vpc))
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith(EXAM_ID, { category: CAT.vpc }))
    expect((await screen.findAllByRole('listitem')).length).toBeGreaterThan(0)
    await waitFor(async () => expect(await rows()).toHaveLength(3))
  })

  it('only one category filter is active at a time: the other classification returns to "Todas"', async () => {
    open(service(), `?category=${CAT.seguridad}`)
    await rows()
    expect((screen.getByLabelText('Categoría (Servicio)') as HTMLSelectElement).selectedOptions[0].textContent).toBe('Todas')
    choose(document.body, 'Categoría (Servicio)', 'VPC')
    await waitFor(() => expect((screen.getByLabelText('Categoría (Dominio)') as HTMLSelectElement).selectedOptions[0].textContent).toBe('Todas'))
    expect(query().get('category')).toBe(CAT.vpc)
  })

  it('typing in the search box writes q to the URL; clearing it removes q', async () => {
    const { spy } = open()
    await rows()
    fireEvent.change(filterBox('Buscar en el enunciado'), { target: { value: 'cifrado' } })
    await waitFor(() => expect(query().get('q')).toBe('cifrado'))
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith(EXAM_ID, { q: 'cifrado' }))
    await waitFor(async () => expect(await rows()).toHaveLength(1))
    fireEvent.change(filterBox('Buscar en el enunciado'), { target: { value: '' } })
    await waitFor(() => expect(query().has('q')).toBe(false))
    await waitFor(async () => expect(await rows()).toHaveLength(13))
  })

  it('origin set, difficulty and "sin clasificar" filter and are kept in the URL', async () => {
    const { spy } = open()
    await rows()
    const origins = [...(screen.getByLabelText('Conjunto de origen') as HTMLSelectElement).options].map((o) => o.textContent)
    expect(origins).toEqual(['Todos', 'TD Set 1', 'TD Set 2'])
    choose(document.body, 'Conjunto de origen', 'TD Set 1')
    await waitFor(() => expect(query().get('origin')).toBe('TD Set 1'))
    await waitFor(async () => expect(await rows()).toHaveLength(2))
    choose(document.body, 'Dificultad', 'Difícil')
    await waitFor(() => expect(query().get('difficulty')).toBe('hard'))
    await waitFor(async () => expect(await rows()).toHaveLength(1))
    expect(spy).toHaveBeenLastCalledWith(EXAM_ID, { origin: 'TD Set 1', difficulty: 'hard' })
  })

  it('"Sin clasificar" lists the questions with no primary category', async () => {
    const { spy } = open()
    await rows()
    fireEvent.click(screen.getByLabelText('Sin clasificar'))
    await waitFor(() => expect(query().get('unclassified')).toBe('true'))
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith(EXAM_ID, { unclassified: true }))
    await waitFor(async () => expect(await rows()).toHaveLength(3))
  })

  it('no matches says so and "Quitar filtros" clears the URL', async () => {
    open(service(), '?q=zzzz')
    expect(await screen.findByText('No hay preguntas con estos filtros')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    await waitFor(() => expect(currentLocation()).toBe(BASE))
    expect(await rows()).toHaveLength(13)
  })
})

describe('QuestionBankPage: opening and deleting a question', () => {
  const openFirstSeg = async () => {
    const row = (await rows()).find((r) => within(r).queryByText('seg-1'))!
    fireEvent.click(within(row).getByRole('button'))
  }

  it('clicking a row opens the question in reveal mode with its rationales and explanation', async () => {
    open()
    await openFirstSeg()
    const panel = within(await screen.findByRole('region', { name: 'Pregunta seleccionada' }))
    expect(await panel.findByText('Un bucket público expone datos.')).toBeTruthy()
    expect(panel.getByText('Correcta')).toBeTruthy()
    expect(panel.getByText('Sí: B es correcta.')).toBeTruthy()
    expect(panel.getByText('Explicación de seg-1.')).toBeTruthy()
    expect(panel.getByText('seg-1')).toBeTruthy()
  })

  it('Eliminar pregunta asks for confirmation naming the key; Cancelar changes nothing', async () => {
    const { exams } = open()
    const del = vi.spyOn(exams, 'deleteQuestion')
    await openFirstSeg()
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar pregunta' }))
    const dialog = await findDialog('¿Eliminar la pregunta «seg-1»?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(del).not.toHaveBeenCalled()
    expect(await rows()).toHaveLength(13)
  })

  it('confirming deletes it, announces it, closes the panel and refreshes the list', async () => {
    const { exams } = open()
    const del = vi.spyOn(exams, 'deleteQuestion')
    await openFirstSeg()
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar pregunta' }))
    const dialog = await findDialog('¿Eliminar la pregunta «seg-1»?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar pregunta' }))
    await waitFor(() => expect(del).toHaveBeenCalledWith('q-seg-1'))
    expect(await screen.findByText('Pregunta eliminada')).toBeTruthy()
    await waitFor(async () => expect(await rows()).toHaveLength(12))
    expect(screen.queryByRole('region', { name: 'Pregunta seleccionada' })).toBeNull()
    expect(screen.getByText('12 de 12 preguntas')).toBeTruthy()
  })
})
