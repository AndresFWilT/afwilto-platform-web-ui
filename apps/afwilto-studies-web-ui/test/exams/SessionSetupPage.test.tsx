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
  await screen.findByRole('radio', { name: /Full simulation/ })
  return exams
}
const radio = (name: RegExp | string) => screen.getByRole('radio', { name })
const checkbox = (name: RegExp | string) => screen.getByRole('checkbox', { name })
const startButton = () => screen.getByRole('button', { name: 'Start' }) as HTMLButtonElement

afterEach(() => vi.restoreAllMocks())

describe('SessionSetupPage: the two modes (FR-7)', () => {
  it('"Full simulation" is the default and shows its locked values: 65 questions · 130 min · answers at the end', async () => {
    await open()
    expect((radio(/Full simulation/) as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText('65 questions · 130 min · answers at the end')).toBeTruthy()
    expect(screen.queryByLabelText('Minutes')).toBeNull()
  })

  it('"Custom" offers the selection, the timing and the feedback choices', async () => {
    await open()
    fireEvent.click(radio('Custom'))
    for (const name of ['Random', 'By category', 'Original set', 'Untimed', 'Timed', 'At the end', 'After each question']) {
      expect(radio(name)).toBeTruthy()
    }
    expect(screen.getByLabelText('Number of questions')).toBeTruthy()
  })

  it('the minutes field exists only with "Timed"', async () => {
    await open()
    fireEvent.click(radio('Custom'))
    expect(screen.queryByLabelText('Minutes')).toBeNull()
    fireEvent.click(radio('Timed'))
    expect(screen.getByLabelText('Minutes')).toBeTruthy()
  })

  it('"Original set" is a select of the origin.set values of the bank', async () => {
    const questions = [
      ...bigBank().slice(0, 3),
      simpleQuestion('t1', 0, [], { origin: { set: 'TD Timed Set 3', number: 1 } }),
      simpleQuestion('t2', 1, [], { origin: { set: 'TD Review Set 1', number: 1 } }),
      simpleQuestion('t3', 2, [], { origin: { set: 'TD Timed Set 3', number: 2 } }),
    ]
    await open(service({ questions }))
    fireEvent.click(radio('Custom'))
    fireEvent.click(radio('Original set'))
    expect(optionTexts(page(), 'Set')).toEqual(['', 'TD Review Set 1', 'TD Timed Set 3'])
  })

  it('by categories: the category choices follow the chosen classification', async () => {
    await open()
    fireEvent.click(radio('Custom'))
    fireEvent.click(radio('By category'))
    expect(checkbox(/Seguridad/)).toBeTruthy()
    expect(screen.queryByRole('checkbox', { name: /VPC/ })).toBeNull()
    fireEvent.change(screen.getByLabelText('Classification'), { target: { value: (screen.getByLabelText('Classification') as HTMLSelectElement).options[1].value } })
    expect(checkbox(/VPC/)).toBeTruthy()
    expect(screen.queryByRole('checkbox', { name: /Seguridad/ })).toBeNull()
  })
})

describe('SessionSetupPage: preview and suggested minutes (S09-1)', () => {
  async function chooseVpcAndLambda() {
    fireEvent.click(radio('Custom'))
    fireEvent.click(radio('By category'))
    fireEvent.change(screen.getByLabelText('Classification'), { target: { value: (screen.getByLabelText('Classification') as HTMLSelectElement).options[1].value } })
    fireEvent.click(checkbox(/VPC/))
    fireEvent.click(checkbox(/Lambda/))
    fireEvent.click(radio('Timed'))
  }

  it('shows "14 questions available · 14 will be drawn" and pre-fills 30 minutes for VPC + Lambda with "todas"', async () => {
    await open()
    await chooseVpcAndLambda()
    expect(await screen.findByText('14 questions available · 14 will be drawn')).toBeTruthy()
    await waitFor(() => expect(fieldValue(page(), 'Minutes')).toBe('30'))
  })

  it('editing the minutes to 45 and then adding S3 keeps 45; "reset to suggested" brings the new suggestion (42)', async () => {
    await open()
    await chooseVpcAndLambda()
    await waitFor(() => expect(fieldValue(page(), 'Minutes')).toBe('30'))

    fill(page(), 'Minutes', '45')
    fireEvent.click(checkbox(/Amazon S3/))
    expect(await screen.findByText('20 questions available · 20 will be drawn')).toBeTruthy()
    expect(fieldValue(page(), 'Minutes')).toBe('45')

    fireEvent.click(screen.getByRole('button', { name: 'reset to suggested' }))
    expect(fieldValue(page(), 'Minutes')).toBe('42')
  })

  it('offers "reset to suggested" only after the owner edited the minutes', async () => {
    await open()
    await chooseVpcAndLambda()
    await waitFor(() => expect(fieldValue(page(), 'Minutes')).toBe('30'))
    expect(screen.queryByRole('button', { name: 'reset to suggested' })).toBeNull()
    fill(page(), 'Minutes', '31')
    expect(screen.getByRole('button', { name: 'reset to suggested' })).toBeTruthy()
  })

  it('a count smaller than the pool says how many will be taken: "14 questions available · 7 will be drawn", 15 minutes', async () => {
    await open()
    await chooseVpcAndLambda()
    fireEvent.click(radio('Count'))
    fill(page(), 'Number of questions', '7')
    expect(await screen.findByText('14 questions available · 7 will be drawn')).toBeTruthy()
    await waitFor(() => expect(fieldValue(page(), 'Minutes')).toBe('15'))
  })

  it('debounces by 300 ms: three changes 100 ms apart make one preview call, with the last value', async () => {
    const exams = await open()
    const preview = vi.spyOn(exams, 'previewSession')
    fireEvent.click(radio('Custom'))
    for (const value of ['10', '15', '30']) {
      fill(page(), 'Number of questions', value)
      await new Promise((r) => setTimeout(r, 100))
    }
    expect(await screen.findByText(/30 will be drawn$/)).toBeTruthy()
    const randomCalls = preview.mock.calls.filter(([, config]) => config.selection.kind === 'random')
    expect(randomCalls).toHaveLength(1)
    expect(randomCalls[0][1].selection).toEqual({ kind: 'random', count: 30 })
  })

  it('does not preview an incomplete selection (no category chosen) and keeps "Start" off', async () => {
    const exams = await open()
    fireEvent.click(radio('Custom'))
    fireEvent.click(radio('By category'))
    const preview = vi.spyOn(exams, 'previewSession')
    await new Promise((r) => setTimeout(r, 450))
    expect(preview.mock.calls.filter(([, c]) => c.selection.kind === 'categories')).toHaveLength(0)
    expect(startButton().disabled).toBe(true)
  })

  it('a failed preview is shown and keeps "Start" off', async () => {
    const exams = service()
    vi.spyOn(exams, 'previewSession').mockRejectedValue(new Error('el servidor no responde'))
    await open(exams)
    expect(await screen.findByText(/Could not calculate the preview/)).toBeTruthy()
    expect(startButton().disabled).toBe(true)
  })
})

describe('SessionSetupPage: shortages (S09-2)', () => {
  it('a preview with shortages lists each category as "7 more needed in Seguridad" and disables "Start"', async () => {
    await open(service({}, { [DOM.seguridad]: 12 }))
    expect(await screen.findByText('7 more needed in Seguridad')).toBeTruthy()
    expect(startButton().disabled).toBe(true)
  })

  it('without shortages "Start" is enabled once the preview arrives', async () => {
    await open()
    await screen.findByText('160 questions available · 65 will be drawn')
    expect(startButton().disabled).toBe(false)
    expect(screen.queryByText(/more needed/)).toBeNull()
  })
})

describe('SessionSetupPage: starting', () => {
  it('starts a simulation and goes to the runner of the new attempt', async () => {
    const exams = await open()
    await screen.findByText('160 questions available · 65 will be drawn')
    fireEvent.click(startButton())
    await waitFor(() => expect(currentLocation()).toMatch(/^\/studies\/attempts\/[0-9a-f-]{36}$/))
    const id = currentLocation().split('/').pop()!
    expect((await exams.getAttempt(id)).config).toEqual({ selection: { kind: 'simulation' } })
  })

  it('starts a custom session with the timing and feedback chosen', async () => {
    const exams = await open()
    fireEvent.click(radio('Custom'))
    fill(page(), 'Number of questions', '12')
    fireEvent.click(radio('Timed'))
    fireEvent.click(radio('After each question'))
    await screen.findByText('165 questions available · 12 will be drawn')
    await waitFor(() => expect(fieldValue(page(), 'Minutes')).toBe('24'))
    fireEvent.click(startButton())
    await waitFor(() => expect(currentLocation()).toMatch(/^\/studies\/attempts\//))
    const id = currentLocation().split('/').pop()!
    expect((await exams.getAttempt(id)).config).toEqual({ selection: { kind: 'random', count: 12 }, timing: { kind: 'timed', minutes: 24 }, feedback: 'each' })
  })

  it('"Start" stays off while the minutes are out of range', async () => {
    await open()
    fireEvent.click(radio('Custom'))
    fireEvent.click(radio('Timed'))
    await waitFor(() => expect(fieldValue(page(), 'Minutes')).toBe('40'))
    fill(page(), 'Minutes', '601')
    expect(startButton().disabled).toBe(true)
    fill(page(), 'Minutes', '60')
    expect(startButton().disabled).toBe(false)
  })

  it('a 409 attempt_in_progress says "You have a practice exam in progress" and offers "Continue" to that attempt, with no way to discard it (S09-11)', async () => {
    const exams = service()
    const existing = await exams.startAttempt(EXAM_ID, { selection: { kind: 'simulation' } }, 1)
    await open(exams)
    await screen.findByText('160 questions available · 65 will be drawn')
    fireEvent.click(startButton())
    expect(await screen.findByText('You have a practice exam in progress')).toBeTruthy()
    const link = screen.getByRole('link', { name: 'Continue' })
    expect(link.getAttribute('href')).toBe(`/studies/attempts/${existing.id}`)
    expect(screen.queryByRole('button', { name: /discard|abandon|cancel practice exam|delete/i })).toBeNull()
    expect(within(page()).queryByText(/descartar/i)).toBeNull()
  })

  it('a start that fails for another reason shows its message and stays on the form', async () => {
    const exams = service()
    vi.spyOn(exams, 'startAttempt').mockRejectedValue(new Error('base de datos no disponible'))
    await open(exams)
    await screen.findByText('160 questions available · 65 will be drawn')
    fireEvent.click(startButton())
    expect(await screen.findByText('base de datos no disponible')).toBeTruthy()
    expect(currentLocation()).toBe(URL)
  })

  it('an unknown exam says it was not found', async () => {
    renderAt('/studies/exams/nope/start', undefined, service())
    expect(await screen.findByText('Exam not found')).toBeTruthy()
  })
})
