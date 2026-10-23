import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { currentLocation, renderAt } from '../support/renderStudies'
import { fieldValue, fill, optionTexts } from '../support/forms'
import { EXAM_ID } from './examFixtures'
import { DOM, bigBank, bigSeed, simpleQuestion } from './attemptFixtures'

const URL = `/studies/exams/${EXAM_ID}/start`
const page = () => document.body
const service = (overrides = {}, perDomain: Partial<Record<string, number>> = {}) => new InMemoryExamsAdapter(bigSeed(overrides, perDomain))
const open = async (exams = service()) => {
  renderAt(URL, undefined, exams)
  await screen.findByRole('radio', { name: /Simulacro real/ })
  return exams
}
const radio = (name: RegExp | string) => screen.getByRole('radio', { name })
const checkbox = (name: RegExp | string) => screen.getByRole('checkbox', { name })
const startButton = () => screen.getByRole('button', { name: 'Empezar' }) as HTMLButtonElement

afterEach(() => vi.restoreAllMocks())

describe('SessionSetupPage: the two modes (FR-7)', () => {
  it('"Simulacro real" is the default and shows its locked values: 65 preguntas · 130 min · respuestas al final', async () => {
    await open()
    expect((radio(/Simulacro real/) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('65 preguntas · 130 min · respuestas al final')).toBeTruthy()
    expect(screen.queryByLabelText('Minutos')).toBeNull()
  })

  it('"Personalizado" offers the selection, the timing and the feedback choices', async () => {
    await open()
    fireEvent.click(radio('Personalizado'))
    for (const name of ['Aleatorio', 'Por categorías', 'Set original', 'Sin tiempo', 'Con tiempo', 'Al final', 'Después de cada pregunta']) {
      expect(radio(name)).toBeTruthy()
    }
    expect(screen.getByLabelText('Número de preguntas')).toBeTruthy()
  })

  it('the minutes field exists only with "Con tiempo"', async () => {
    await open()
    fireEvent.click(radio('Personalizado'))
    expect(screen.queryByLabelText('Minutos')).toBeNull()
    fireEvent.click(radio('Con tiempo'))
    expect(screen.getByLabelText('Minutos')).toBeTruthy()
  })

  it('"Set original" is a select of the origin.set values of the bank', async () => {
    const questions = [
      ...bigBank().slice(0, 3),
      simpleQuestion('t1', 0, [], { origin: { set: 'TD Timed Set 3', number: 1 } }),
      simpleQuestion('t2', 1, [], { origin: { set: 'TD Review Set 1', number: 1 } }),
      simpleQuestion('t3', 2, [], { origin: { set: 'TD Timed Set 3', number: 2 } }),
    ]
    await open(service({ questions }))
    fireEvent.click(radio('Personalizado'))
    fireEvent.click(radio('Set original'))
    expect(optionTexts(page(), 'Set')).toEqual(['', 'TD Review Set 1', 'TD Timed Set 3'])
  })

  it('by categories: the category choices follow the chosen classification', async () => {
    await open()
    fireEvent.click(radio('Personalizado'))
    fireEvent.click(radio('Por categorías'))
    expect(checkbox(/Seguridad/)).toBeTruthy()
    expect(screen.queryByRole('checkbox', { name: /VPC/ })).toBeNull()
    fireEvent.change(screen.getByLabelText('Clasificación'), { target: { value: (screen.getByLabelText('Clasificación') as HTMLSelectElement).options[1].value } })
    expect(checkbox(/VPC/)).toBeTruthy()
    expect(screen.queryByRole('checkbox', { name: /Seguridad/ })).toBeNull()
  })
})

describe('SessionSetupPage: preview and suggested minutes (S09-1)', () => {
  async function chooseVpcAndLambda() {
    fireEvent.click(radio('Personalizado'))
    fireEvent.click(radio('Por categorías'))
    fireEvent.change(screen.getByLabelText('Clasificación'), { target: { value: (screen.getByLabelText('Clasificación') as HTMLSelectElement).options[1].value } })
    fireEvent.click(checkbox(/VPC/))
    fireEvent.click(checkbox(/Lambda/))
    fireEvent.click(radio('Con tiempo'))
  }

  it('shows "Hay 14 preguntas · se tomarán 14" and pre-fills 30 minutes for VPC + Lambda with "todas"', async () => {
    await open()
    await chooseVpcAndLambda()
    expect(await screen.findByText('Hay 14 preguntas · se tomarán 14')).toBeTruthy()
    await waitFor(() => expect(fieldValue(page(), 'Minutos')).toBe('30'))
  })

  it('editing the minutes to 45 and then adding S3 keeps 45; "restablecer sugerido" brings the new suggestion (42)', async () => {
    await open()
    await chooseVpcAndLambda()
    await waitFor(() => expect(fieldValue(page(), 'Minutos')).toBe('30'))

    fill(page(), 'Minutos', '45')
    fireEvent.click(checkbox(/Amazon S3/))
    expect(await screen.findByText('Hay 20 preguntas · se tomarán 20')).toBeTruthy()
    expect(fieldValue(page(), 'Minutos')).toBe('45')

    fireEvent.click(screen.getByRole('button', { name: 'restablecer sugerido' }))
    expect(fieldValue(page(), 'Minutos')).toBe('42')
  })

  it('offers "restablecer sugerido" only after the owner edited the minutes', async () => {
    await open()
    await chooseVpcAndLambda()
    await waitFor(() => expect(fieldValue(page(), 'Minutos')).toBe('30'))
    expect(screen.queryByRole('button', { name: 'restablecer sugerido' })).toBeNull()
    fill(page(), 'Minutos', '31')
    expect(screen.getByRole('button', { name: 'restablecer sugerido' })).toBeTruthy()
  })

  it('a count smaller than the pool says how many will be taken: "Hay 14 preguntas · se tomarán 7", 15 minutes', async () => {
    await open()
    await chooseVpcAndLambda()
    fireEvent.click(radio('Cantidad'))
    fill(page(), 'Cantidad de preguntas', '7')
    expect(await screen.findByText('Hay 14 preguntas · se tomarán 7')).toBeTruthy()
    await waitFor(() => expect(fieldValue(page(), 'Minutos')).toBe('15'))
  })

  it('debounces: three quick changes make one preview call, with the last value', async () => {
    const exams = await open()
    const preview = vi.spyOn(exams, 'previewSession')
    fireEvent.click(radio('Personalizado'))
    for (const value of ['10', '15', '30']) fill(page(), 'Número de preguntas', value)
    expect(await screen.findByText(/se tomarán 30$/)).toBeTruthy()
    const randomCalls = preview.mock.calls.filter(([, config]) => config.selection.kind === 'random')
    expect(randomCalls).toHaveLength(1)
    expect(randomCalls[0][1].selection).toEqual({ kind: 'random', count: 30 })
  })

  it('does not preview an incomplete selection (no category chosen) and keeps "Empezar" off', async () => {
    const exams = await open()
    fireEvent.click(radio('Personalizado'))
    fireEvent.click(radio('Por categorías'))
    const preview = vi.spyOn(exams, 'previewSession')
    await new Promise((r) => setTimeout(r, 450))
    expect(preview.mock.calls.filter(([, c]) => c.selection.kind === 'categories')).toHaveLength(0)
    expect(startButton().disabled).toBe(true)
  })

  it('a failed preview is shown and keeps "Empezar" off', async () => {
    const exams = service()
    vi.spyOn(exams, 'previewSession').mockRejectedValue(new Error('el servidor no responde'))
    await open(exams)
    expect(await screen.findByText(/No se pudo calcular la vista previa/)).toBeTruthy()
    expect(startButton().disabled).toBe(true)
  })
})

describe('SessionSetupPage: shortages (S09-2)', () => {
  it('a preview with shortages lists each category as "faltan 7 en Seguridad" and disables "Empezar"', async () => {
    await open(service({}, { [DOM.seguridad]: 12 }))
    expect(await screen.findByText('faltan 7 en Seguridad')).toBeTruthy()
    expect(startButton().disabled).toBe(true)
  })

  it('without shortages "Empezar" is enabled once the preview arrives', async () => {
    await open()
    await screen.findByText('Hay 160 preguntas · se tomarán 65')
    expect(startButton().disabled).toBe(false)
    expect(screen.queryByText(/faltan/)).toBeNull()
  })
})

describe('SessionSetupPage: starting', () => {
  it('starts a simulation and goes to the runner of the new attempt', async () => {
    const exams = await open()
    await screen.findByText('Hay 160 preguntas · se tomarán 65')
    fireEvent.click(startButton())
    await waitFor(() => expect(currentLocation()).toMatch(/^\/studies\/attempts\/[0-9a-f-]{36}$/))
    const id = currentLocation().split('/').pop()!
    expect((await exams.getAttempt(id)).config).toEqual({ selection: { kind: 'simulation' } })
  })

  it('starts a custom session with the timing and feedback chosen', async () => {
    const exams = await open()
    fireEvent.click(radio('Personalizado'))
    fill(page(), 'Número de preguntas', '12')
    fireEvent.click(radio('Con tiempo'))
    fireEvent.click(radio('Después de cada pregunta'))
    await screen.findByText('Hay 165 preguntas · se tomarán 12')
    await waitFor(() => expect(fieldValue(page(), 'Minutos')).toBe('24'))
    fireEvent.click(startButton())
    await waitFor(() => expect(currentLocation()).toMatch(/^\/studies\/attempts\//))
    const id = currentLocation().split('/').pop()!
    expect((await exams.getAttempt(id)).config).toEqual({ selection: { kind: 'random', count: 12 }, timing: { kind: 'timed', minutes: 24 }, feedback: 'each' })
  })

  it('"Empezar" stays off while the minutes are out of range', async () => {
    await open()
    fireEvent.click(radio('Personalizado'))
    fireEvent.click(radio('Con tiempo'))
    await waitFor(() => expect(fieldValue(page(), 'Minutos')).toBe('40'))
    fill(page(), 'Minutos', '601')
    expect(startButton().disabled).toBe(true)
    fill(page(), 'Minutos', '60')
    expect(startButton().disabled).toBe(false)
  })

  it('a 409 attempt_in_progress says "Tienes un simulacro en curso" and offers "Continuar" to that attempt, with no way to discard it (S09-11)', async () => {
    const exams = service()
    const existing = await exams.startAttempt(EXAM_ID, { selection: { kind: 'simulation' } }, 1)
    await open(exams)
    await screen.findByText('Hay 160 preguntas · se tomarán 65')
    fireEvent.click(startButton())
    expect(await screen.findByText('Tienes un simulacro en curso')).toBeTruthy()
    const link = screen.getByRole('link', { name: 'Continuar' })
    expect(link.getAttribute('href')).toBe(`/studies/attempts/${existing.id}`)
    expect(screen.queryByRole('button', { name: /descartar|abandonar|cancelar simulacro|eliminar/i })).toBeNull()
    expect(within(page()).queryByText(/descartar/i)).toBeNull()
  })

  it('a start that fails for another reason shows its message and stays on the form', async () => {
    const exams = service()
    vi.spyOn(exams, 'startAttempt').mockRejectedValue(new Error('base de datos no disponible'))
    await open(exams)
    await screen.findByText('Hay 160 preguntas · se tomarán 65')
    fireEvent.click(startButton())
    expect(await screen.findByText('base de datos no disponible')).toBeTruthy()
    expect(currentLocation()).toBe(URL)
  })

  it('an unknown exam says it was not found', async () => {
    renderAt('/studies/exams/nope/start', undefined, service())
    expect(await screen.findByText('Examen no encontrado')).toBeTruthy()
  })
})
