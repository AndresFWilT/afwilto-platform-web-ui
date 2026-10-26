import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { ExamsConflictError } from '../../src/exams/application/ports'
import type { AnswerInput } from '../../src/exams/domain'
import type { SessionConfig } from '../../src/exams/domain'
import { currentLocation, renderAt } from '../support/renderStudies'
import { findDialog } from '../support/forms'
import { EXAM_ID } from './examFixtures'
import { TestClock, bigSeed, simpleQuestion } from './attemptFixtures'

const random = (count: number, extra: Partial<SessionConfig> = {}): SessionConfig => ({ selection: { kind: 'random', count }, timing: { kind: 'untimed' }, feedback: 'end', ...extra })
const timed = (minutes: number, extra: Partial<SessionConfig> = {}): SessionConfig => random(5, { timing: { kind: 'timed', minutes }, ...extra })

function setup(seedOverrides = {}) {
  const clock = new TestClock()
  const exams = new InMemoryExamsAdapter(bigSeed(seedOverrides), { now: clock.now })
  return { clock, exams }
}

async function open(exams: InMemoryExamsAdapter, config: SessionConfig, { query = '', seed = 1 } = {}) {
  const attempt = await exams.startAttempt(EXAM_ID, config, seed)
  renderAt(`/studies/attempts/${attempt.id}${query}`, undefined, exams)
  await screen.findByText(/^Question \d+ of \d+$/)
  return attempt
}

const options = () => [...document.querySelectorAll<HTMLElement>('[role=radio], [role=checkbox]')]
const checked = () => options().filter((o) => o.getAttribute('aria-checked') === 'true')
const cell = (n: number) => screen.getByRole('button', { name: new RegExp(`^Question ${n},`) })
const header = () => screen.getByText(/^Question \d+ of \d+$/).textContent
const press = (key: string) => fireEvent.keyDown(document.body, { key })

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('RunnerPage: layout', () => {
  it('shows the exam name, "Question 1 of 15", the question and its options; no countdown when untimed', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    expect(screen.getByText('SAA-C03')).toBeTruthy()
    expect(header()).toBe('Question 1 of 15')
    expect(options()).toHaveLength(4)
    expect(screen.queryByRole('timer')).toBeNull()
  })

  it('shows the countdown when timed', async () => {
    const { exams } = setup()
    await open(exams, timed(5))
    expect(screen.getByRole('timer').textContent).toBe('5:00')
  })

  it('has a footer with Previous / Next, "Flag for review" and Submit, and no pause control (D-12)', async () => {
    const { exams } = setup()
    await open(exams, timed(5))
    for (const name of ['Previous', 'Next', 'Flag for review', 'Submit']) expect(screen.getByRole('button', { name })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /paus/i })).toBeNull()
  })

  it('has a navigator with one numbered cell per question, in a wrapping grid', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    const cells = screen.getAllByRole('button', { name: /^Question \d+, / })
    expect(cells).toHaveLength(15)
    expect(cells[0].getAttribute('aria-label')).toBe('Question 1, unanswered')
    expect(cells[0].getAttribute('aria-current')).toBe('step')
    expect(cells[14].textContent).toContain('15')
  })

  it('an unknown attempt says it was not found', async () => {
    renderAt('/studies/attempts/nope', undefined, setup().exams)
    expect(await screen.findByText('Practice exam not found')).toBeTruthy()
  })

  it('an attempt that is already closed goes to its result', async () => {
    const { exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, random(3), 1)
    await exams.submitAttempt(attempt.id)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
  })
})

describe('RunnerPage: answering and the navigator (S09-6)', () => {
  it('choosing an option saves it with a PUT and the cell becomes "answered"', async () => {
    const { exams } = setup()
    const put = vi.spyOn(exams, 'answerItem')
    const attempt = await open(exams, random(15))
    fireEvent.click(options()[1])
    expect(checked()).toEqual([options()[1]])
    await waitFor(() => expect(put).toHaveBeenCalledWith(attempt.id, 0, { selected: ['B'], flagged: false }))
    expect(cell(1).getAttribute('aria-label')).toBe('Question 1, answered')
  })

  it('the navigator cell of an answered, flagged item says "Question 3, answered, flagged" (S09-6)', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    fireEvent.click(cell(3))
    fireEvent.click(options()[0])
    fireEvent.click(screen.getByRole('button', { name: 'Flag for review' }))
    await waitFor(() => expect(cell(3).getAttribute('aria-label')).toBe('Question 3, answered, flagged'))
    expect(cell(1).getAttribute('aria-label')).toBe('Question 1, unanswered')
  })

  it('flagging alone sends the flag with the current (empty) selection', async () => {
    const { exams } = setup()
    const put = vi.spyOn(exams, 'answerItem')
    const attempt = await open(exams, random(15))
    const flag = screen.getByRole('button', { name: 'Flag for review' })
    expect(flag.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(flag)
    expect(flag.getAttribute('aria-pressed')).toBe('true')
    await waitFor(() => expect(put).toHaveBeenCalledWith(attempt.id, 0, { selected: [], flagged: true }))
    expect(cell(1).getAttribute('aria-label')).toBe('Question 1, unanswered, flagged')
  })

  it('while a save is in flight the cell is busy (a spinner), and it settles after', async () => {
    const { exams } = setup()
    let release: () => void = () => {}
    const original = exams.answerItem.bind(exams)
    vi.spyOn(exams, 'answerItem').mockImplementation(async (...args) => {
      await new Promise<void>((resolve) => (release = resolve))
      return original(...args)
    })
    await open(exams, random(15))
    fireEvent.click(options()[0])
    await waitFor(() => expect(cell(1).getAttribute('aria-busy')).toBe('true'))
    release()
    await waitFor(() => expect(cell(1).getAttribute('aria-busy')).toBeNull())
  })

  it('a failed save keeps the local choice and shows a retry toast; "Retry" sends it again', async () => {
    const { exams } = setup()
    const put = vi.spyOn(exams, 'answerItem').mockRejectedValueOnce(new Error('sin conexión'))
    await open(exams, random(15))
    fireEvent.click(options()[2])
    const toast = await screen.findByRole('alert')
    expect(toast.textContent).toContain('Could not save question 1')
    expect(checked()).toEqual([options()[2]])
    fireEvent.click(within(toast).getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(put).toHaveBeenCalledTimes(2))
    expect(put).toHaveBeenLastCalledWith(expect.any(String), 0, { selected: ['C'], flagged: false })
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(cell(1).getAttribute('aria-label')).toBe('Question 1, answered')
  })

  it('saves of one item go out in order, so the last choice wins', async () => {
    const { exams } = setup()
    const sent: string[][] = []
    const original = exams.answerItem.bind(exams)
    vi.spyOn(exams, 'answerItem').mockImplementation(async (id, position, answer) => {
      await new Promise((r) => setTimeout(r, sent.length === 0 ? 30 : 0))
      sent.push(answer.selected)
      return original(id, position, answer)
    })
    const attempt = await open(exams, random(15))
    fireEvent.click(options()[0])
    fireEvent.click(options()[1])
    await waitFor(() => expect(sent).toEqual([['A'], ['B']]))
    expect((await exams.getAttempt(attempt.id)).items[0].selected).toEqual(['B'])
  })

  it('a multi question shows "Choose 2" and sends the answer with both labels', async () => {
    const multi = simpleQuestion('m1', 0, [], { type: 'multi', options: ['A', 'B', 'C', 'D'].map((label, i) => ({ label, text: `m ${label}`, correct: i < 2 })) })
    const { exams } = setup({ questions: [multi] })
    const put = vi.spyOn(exams, 'answerItem')
    await open(exams, random(1))
    expect(screen.getByText('Choose 2')).toBeTruthy()
    fireEvent.click(options()[0])
    fireEvent.click(options()[1])
    fireEvent.click(options()[2])
    expect(checked()).toHaveLength(2)
    await waitFor(() => expect(put).toHaveBeenLastCalledWith(expect.any(String), 0, { selected: expect.arrayContaining([expect.any(String)]), flagged: false }))
    expect(put.mock.calls.at(-1)![2].selected).toHaveLength(2)
  })
})

describe('RunnerPage: moving around and the URL (S09-7)', () => {
  it('Next and Previous move between questions and keep the position in ?q=', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(header()).toBe('Question 2 of 15')
    expect(currentLocation()).toMatch(/\?q=2$/)
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(header()).toBe('Question 1 of 15')
  })

  it('a navigator cell jumps to its question', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    fireEvent.click(cell(9))
    expect(header()).toBe('Question 9 of 15')
    expect(currentLocation()).toMatch(/\?q=9$/)
    expect(cell(9).getAttribute('aria-current')).toBe('step')
  })

  it('the last question has no Next', async () => {
    const { exams } = setup()
    await open(exams, random(3), { query: '?q=3' })
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('reopening attempts/:id?q=12 returns to question 12 with its answers, flags and the others restored (S09-7)', async () => {
    const { exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, random(15), 1)
    await exams.answerItem(attempt.id, 11, { selected: ['C'], flagged: false })
    await exams.answerItem(attempt.id, 2, { selected: [], flagged: true })
    renderAt(`/studies/attempts/${attempt.id}?q=12`, undefined, exams)
    await screen.findByText('Question 12 of 15')
    expect(checked().map((o) => o.textContent?.[0])).toEqual(['C'])
    expect(cell(12).getAttribute('aria-label')).toBe('Question 12, answered')
    expect(cell(3).getAttribute('aria-label')).toBe('Question 3, unanswered, flagged')
    expect((screen.getByRole('button', { name: 'Flag for review' }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe('false')
  })

  it('a ?q= outside the attempt falls back to the nearest question', async () => {
    const { exams } = setup()
    await open(exams, random(15), { query: '?q=99' })
    expect(header()).toBe('Question 15 of 15')
  })

  it('without ?q= it starts at question 1', async () => {
    const { exams } = setup()
    await open(exams, random(15), { query: '?q=abc' })
    expect(header()).toBe('Question 1 of 15')
  })
})

describe('RunnerPage: keyboard', () => {
  it('→ and ← move between questions, Enter goes to the next one', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    press('ArrowRight')
    expect(header()).toBe('Question 2 of 15')
    press('ArrowRight')
    expect(header()).toBe('Question 3 of 15')
    press('ArrowLeft')
    expect(header()).toBe('Question 2 of 15')
    press('Enter')
    expect(header()).toBe('Question 3 of 15')
  })

  it('arrows do not leave the attempt', async () => {
    const { exams } = setup()
    await open(exams, random(3))
    press('ArrowLeft')
    expect(header()).toBe('Question 1 of 3')
  })

  it('F flags and unflags the question', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    press('f')
    expect(screen.getByRole('button', { name: 'Flag for review' }).getAttribute('aria-pressed')).toBe('true')
    await waitFor(() => expect(cell(1).getAttribute('aria-label')).toBe('Question 1, unanswered, flagged'))
    press('F')
    expect(screen.getByRole('button', { name: 'Flag for review' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('the keys 1–6 belong to QuestionView: 2 picks the second option', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    const second = options()[1]
    fireEvent.keyDown(second, { key: '2' })
    expect(checked()).toEqual([second])
  })

  it('keys typed in a form control are ignored', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    const field = document.createElement('input')
    document.body.appendChild(field)
    fireEvent.keyDown(field, { key: 'ArrowRight' })
    fireEvent.keyDown(field, { key: 'f' })
    field.remove()
    expect(header()).toBe('Question 1 of 15')
    expect(screen.getByRole('button', { name: 'Flag for review' }).getAttribute('aria-pressed')).toBe('false')
  })
})

describe('RunnerPage: review mode (feedback each) (S09-5)', () => {
  it('answering shows the reveal and locks the item; further clicks change nothing; F still flags', async () => {
    const { exams } = setup()
    const put = vi.spyOn(exams, 'answerItem')
    const attempt = await open(exams, random(5, { feedback: 'each' }))
    fireEvent.click(options()[1])
    expect(await screen.findByText('Explanation')).toBeTruthy()
    expect(screen.getAllByText('Your answer').length).toBeGreaterThan(0)
    expect(options().every((o) => o.getAttribute('aria-disabled') === 'true')).toBe(true)

    fireEvent.click(options()[2])
    fireEvent.click(options()[0])
    expect(checked()).toEqual([options()[1]])
    expect(put).toHaveBeenCalledTimes(1)

    press('f')
    await waitFor(() => expect(put).toHaveBeenCalledTimes(2))
    expect(put).toHaveBeenLastCalledWith(attempt.id, 0, { selected: ['B'], flagged: true })
    expect(cell(1).getAttribute('aria-label')).toBe('Question 1, answered, flagged')
    expect(screen.getByText('Explanation')).toBeTruthy()
  })

  it('the reveal survives a reload of the attempt', async () => {
    const { exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, random(5, { feedback: 'each' }), 1)
    await exams.answerItem(attempt.id, 0, { selected: ['A'], flagged: false })
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    expect(await screen.findByText('Explanation')).toBeTruthy()
    expect(options().every((o) => o.getAttribute('aria-disabled') === 'true')).toBe(true)
  })

  it('under "end" nothing is revealed after answering', async () => {
    const { exams } = setup()
    await open(exams, random(5))
    fireEvent.click(options()[1])
    await waitFor(() => expect(cell(1).getAttribute('aria-label')).toBe('Question 1, answered'))
    expect(screen.queryByText('Explanation')).toBeNull()
    expect(options().some((o) => o.getAttribute('aria-disabled') === 'true')).toBe(false)
  })

  it('a multi question reveals only once N labels are chosen: the first click is held back', async () => {
    const multi = simpleQuestion('m1', 0, [], { type: 'multi', options: ['A', 'B', 'C', 'D'].map((label, i) => ({ label, text: `m ${label}`, correct: i < 2 })) })
    const { exams } = setup({ questions: [multi] })
    const put = vi.spyOn(exams, 'answerItem')
    await open(exams, random(1, { feedback: 'each' }))
    fireEvent.click(options()[0])
    await new Promise((r) => setTimeout(r, 30))
    expect(put).not.toHaveBeenCalled()
    expect(screen.queryByText('Explanation')).toBeNull()
    expect(checked()).toHaveLength(1)
    fireEvent.click(options()[1])
    expect(await screen.findByText('Explanation')).toBeTruthy()
    expect(put).toHaveBeenCalledTimes(1)
    expect(put.mock.calls[0][2].selected).toHaveLength(2)
  })
})

describe('RunnerPage: submitting (S09-8)', () => {
  async function answered(count: number, total = 15) {
    const { exams } = setup()
    const attempt = await open(exams, random(total))
    for (let i = 0; i < count; i++) {
      fireEvent.click(cell(i + 1))
      fireEvent.click(options()[0])
    }
    await waitFor(() => expect(cell(count).getAttribute('aria-label')).toBe(`Question ${count}, answered`))
    return { exams, attempt }
  }

  it('"Submit" with 2 unanswered items asks "You have 2 unanswered. Submit?"; confirming submits and opens the result', async () => {
    const { exams, attempt } = await answered(13)
    const submit = vi.spyOn(exams, 'submitAttempt')
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    const dialog = await findDialog('You have 2 unanswered. Submit?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Yes, submit' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('cancelling keeps the attempt open and submits nothing', async () => {
    const { exams } = await answered(13)
    const submit = vi.spyOn(exams, 'submitAttempt')
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    const dialog = await findDialog('You have 2 unanswered. Submit?')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(submit).not.toHaveBeenCalled()
    expect(currentLocation()).toMatch(/^\/studies\/attempts\/[0-9a-f-]+(\?q=\d+)?$/)
  })

  it('says "You have 1 unanswered" for one, and asks plainly when everything is answered', async () => {
    const one = await answered(2, 3)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await findDialog('You have 1 unanswered. Submit?')).toBeTruthy()
    expect(one.attempt.items).toHaveLength(3)
  })

  it('with every item answered the confirmation asks "Submit the practice exam?"', async () => {
    await answered(3, 3)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await findDialog('Submit the practice exam?')).toBeTruthy()
  })

  it('waits for saves in flight before submitting', async () => {
    const { exams } = setup()
    const order: string[] = []
    const original = exams.answerItem.bind(exams)
    vi.spyOn(exams, 'answerItem').mockImplementation(async (...args) => {
      await new Promise((r) => setTimeout(r, 40))
      order.push('answer')
      return original(...args)
    })
    const submit = exams.submitAttempt.bind(exams)
    vi.spyOn(exams, 'submitAttempt').mockImplementation(async (id) => {
      order.push('submit')
      return submit(id)
    })
    await open(exams, random(1))
    fireEvent.click(options()[0])
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('Submit the practice exam?')).getByRole('button', { name: 'Yes, submit' }))
    await waitFor(() => expect(currentLocation()).toMatch(/\/result$/))
    expect(order).toEqual(['answer', 'submit'])
  })

  it('a submit that fails keeps the runner and shows the failure', async () => {
    const { exams } = setup()
    vi.spyOn(exams, 'submitAttempt').mockRejectedValue(new Error('el servidor no responde'))
    await open(exams, random(1))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('You have 1 unanswered. Submit?')).getByRole('button', { name: 'Yes, submit' }))
    expect(await screen.findByText(/el servidor no responde/)).toBeTruthy()
    expect(currentLocation()).not.toMatch(/result/)
  })
})

describe('RunnerPage: the timer (S09-3, S09-4)', () => {
  // Only the interval and the clock are faked, so Testing Library's own timeouts keep working.
  const fakeTime = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date', 'performance'] })
  const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

  it('at 0 it submits once and opens the result (S09-3)', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const submit = vi.spyOn(exams, 'submitAttempt')
    const attempt = await exams.startAttempt(EXAM_ID, timed(1), 1)
    clock.advance(55)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    expect(screen.getByRole('timer').textContent).toBe('0:05')
    await advance(2000)
    expect(screen.getByRole('timer').textContent).toBe('0:03')
    expect(submit).not.toHaveBeenCalled()
    await advance(3000)
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
    expect(submit).toHaveBeenCalledTimes(1)
    await advance(10_000)
    expect(submit).toHaveBeenCalledTimes(1)
  })

  it('the countdown reaching 0 while a manual submit is pending does not submit a second time', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(1), 1)
    clock.advance(59)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    let release: () => void = () => {}
    const original = exams.submitAttempt.bind(exams)
    const submit = vi.spyOn(exams, 'submitAttempt').mockImplementation(async (id) => {
      await new Promise<void>((resolve) => (release = resolve))
      return original(id)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('You have 5 unanswered. Submit?')).getByRole('button', { name: 'Yes, submit' }))
    await advance(0)
    expect(submit).toHaveBeenCalledTimes(1)
    await advance(2000)
    expect(submit).toHaveBeenCalledTimes(1)
    release()
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
  })

  it('if the server already expired the attempt, submit is refused and the result opens anyway', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(1), 1)
    clock.advance(59)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    vi.spyOn(exams, 'submitAttempt').mockRejectedValue(new ExamsConflictError('attemptId', 'attempt_expired', 'the deadline passed'))
    await advance(1000)
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
  })

  it('a window focus asks the server again and the countdown takes its 100 s instead of the local 130 (S09-4)', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(3), 1)
    clock.advance(50)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    expect(screen.getByRole('timer').textContent).toBe('2:10')

    const get = vi.spyOn(exams, 'getAttempt')
    clock.advance(30)
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    await waitFor(() => expect(screen.getByRole('timer').textContent).toBe('1:40'))
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('coming back to a visible tab resyncs too; hiding it does not', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(3), 1)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    const get = vi.spyOn(exams, 'getAttempt')
    const visibility = vi.spyOn(document, 'visibilityState', 'get')

    visibility.mockReturnValue('hidden')
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(get).not.toHaveBeenCalled()

    clock.advance(20)
    visibility.mockReturnValue('visible')
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })
    await waitFor(() => expect(screen.getByRole('timer').textContent).toBe('2:40'))
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('every PUT response resyncs the countdown from the server', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(3), 1)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    clock.advance(45)
    fireEvent.click(options()[0])
    await waitFor(() => expect(screen.getByRole('timer').textContent).toBe('2:15'))
  })

  it('a focus after the server expired the attempt opens the result', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(1), 1)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    clock.advance(200)
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
  })

  it('a save refused as attempt_expired opens the result', async () => {
    const { exams } = setup()
    vi.spyOn(exams, 'answerItem').mockRejectedValue(new ExamsConflictError('attemptId', 'attempt_expired', 'the deadline passed'))
    const attempt = await open(exams, timed(1))
    fireEvent.click(options()[0])
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
  })

  it('an untimed attempt never asks the server again on focus', async () => {
    const { exams } = setup()
    await open(exams, random(3))
    const get = vi.spyOn(exams, 'getAttempt')
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect(get).not.toHaveBeenCalled()
  })
})

/** Holds every PUT until the test releases it, then runs the real in-memory save. */
function gated(exams: InMemoryExamsAdapter) {
  const original = exams.answerItem.bind(exams)
  const pending: Array<{ position: number; answer: AnswerInput; release: () => void; fail: (e: Error) => void }> = []
  vi.spyOn(exams, 'answerItem').mockImplementation(
    (id, position, answer) =>
      new Promise((resolve, reject) => {
        pending.push({ position, answer, release: () => original(id, position, answer).then(resolve, reject), fail: reject })
      })
  )
  return pending
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })

describe('RunnerPage: the clock rides on the PUT, errors by rule (contract 0.3.0, M2, M3)', () => {
  const fakeTime = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date', 'performance'] })

  it('a save resyncs the countdown from the PUT response and does not GET the attempt', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(3), 1)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    const get = vi.spyOn(exams, 'getAttempt')
    clock.advance(45)
    fireEvent.click(options()[0])
    await waitFor(() => expect(screen.getByRole('timer').textContent).toBe('2:15'))
    fireEvent.click(options()[1])
    await settle()
    expect(get).not.toHaveBeenCalled()
  })

  it('a save refused as attempt_closed opens the result', async () => {
    const { exams } = setup()
    vi.spyOn(exams, 'answerItem').mockRejectedValue(new ExamsConflictError('status', 'attempt_closed', 'closed'))
    const attempt = await open(exams, timed(1))
    fireEvent.click(options()[0])
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
  })

  it('a save refused as answer_locked re-reads the item from the server: the revealed choice shows, no failure toast', async () => {
    const { exams } = setup()
    const attempt = await open(exams, random(5, { feedback: 'each' }))
    await exams.answerItem(attempt.id, 0, { selected: ['B'], flagged: false })
    fireEvent.click(options()[2])
    expect(await screen.findByText('Explanation')).toBeTruthy()
    expect(checked()).toEqual([options()[1]])
    expect(options().every((o) => o.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('RunnerPage: saves are ordered and deduped against what is queued (R1, R2)', () => {
  // A radio cannot be deselected; a multi option can, which is what these cases need.
  const multi = () => simpleQuestion('m1', 0, [], { type: 'multi', options: ['A', 'B', 'C', 'D'].map((label, i) => ({ label, text: `m ${label}`, correct: i < 2 })) })
  const flagButton = () => screen.getByRole('button', { name: 'Flag for review' })

  it('R1: toggling the flag twice during an in-flight PUT ends with the server flag equal to the UI', async () => {
    const { exams } = setup()
    const pending = gated(exams)
    const attempt = await open(exams, random(3))
    press('f')
    press('f')
    expect(flagButton().getAttribute('aria-pressed')).toBe('false')
    await waitFor(() => expect(pending).toHaveLength(1))
    await act(async () => pending[0].release())
    await waitFor(() => expect(pending).toHaveLength(2))
    await act(async () => pending[1].release())
    await waitFor(() => expect(cell(1).getAttribute('aria-busy')).toBeNull())
    expect(pending.map((p) => p.answer.flagged)).toEqual([true, false])
    expect((await exams.getAttempt(attempt.id)).items[0].flagged).toBe(false)
  })

  it('R1: selecting and deselecting during an in-flight PUT ends with the server selection equal to the UI', async () => {
    const { exams } = setup({ questions: [multi()] })
    const pending = gated(exams)
    const attempt = await open(exams, random(1))
    fireEvent.click(options()[0])
    fireEvent.click(options()[0])
    expect(checked()).toEqual([])
    await waitFor(() => expect(pending).toHaveLength(1))
    await act(async () => pending[0].release())
    await waitFor(() => expect(pending).toHaveLength(2))
    await act(async () => pending[1].release())
    await waitFor(() => expect(cell(1).getAttribute('aria-busy')).toBeNull())
    expect(pending.map((p) => p.answer.selected)).toEqual([['A'], []])
    expect((await exams.getAttempt(attempt.id)).items[0].selected).toEqual([])
  })

  it('R1: select, deselect and select again are three distinct saves, sent in that order', async () => {
    const { exams } = setup({ questions: [multi()] })
    const put = vi.spyOn(exams, 'answerItem')
    await open(exams, random(1))
    fireEvent.click(options()[0])
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    fireEvent.click(options()[0])
    fireEvent.click(options()[0])
    await waitFor(() => expect(put).toHaveBeenCalledTimes(3))
    expect(put.mock.calls.map((c) => c[2].selected)).toEqual([['A'], [], ['A']])
  })

  it('R2: under feedback each, clicking B then C before the first PUT resolves sends one PUT and shows B with its reveal', async () => {
    const { exams } = setup()
    const pending = gated(exams)
    await open(exams, random(5, { feedback: 'each' }))
    fireEvent.click(options()[1])
    fireEvent.click(options()[2])
    expect(checked()).toEqual([options()[1]])
    expect(options().every((o) => o.getAttribute('aria-disabled') === 'true')).toBe(true)
    await waitFor(() => expect(pending).toHaveLength(1))
    await act(async () => pending[0].release())
    expect(await screen.findByText('Explanation')).toBeTruthy()
    expect(pending).toHaveLength(1)
    expect(checked()).toEqual([options()[1]])
  })

  it('R2: a failed first PUT unlocks the item so the choice can be retried', async () => {
    const { exams } = setup()
    const pending = gated(exams)
    await open(exams, random(5, { feedback: 'each' }))
    fireEvent.click(options()[1])
    await waitFor(() => expect(pending).toHaveLength(1))
    await act(async () => pending[0].fail(new Error('sin conexión')))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(options().some((o) => o.getAttribute('aria-disabled') === 'true')).toBe(false)
  })
})

describe('RunnerPage: review mode stays locked while any save of the item is in flight (R7)', () => {
  const allDisabled = () => options().every((o) => o.getAttribute('aria-disabled') === 'true')

  it('flag PUT in flight, then the revealing PUT queued: resolving the flag PUT keeps the options disabled and a click on C sends nothing', async () => {
    const { exams } = setup()
    const pending = gated(exams)
    await open(exams, random(5, { feedback: 'each' }))
    press('f')
    await waitFor(() => expect(pending).toHaveLength(1))
    fireEvent.click(options()[1])
    expect(allDisabled()).toBe(true)
    await act(async () => pending[0].release())
    await waitFor(() => expect(pending).toHaveLength(2))
    expect(allDisabled()).toBe(true)

    fireEvent.click(options()[2])
    await settle()
    expect(pending).toHaveLength(2)
    expect(checked()).toEqual([options()[1]])

    await act(async () => pending[1].release())
    expect(await screen.findByText('Explanation')).toBeTruthy()
    expect(pending).toHaveLength(2)
    expect(pending.map((p) => p.answer)).toEqual([{ selected: [], flagged: true }, { selected: ['B'], flagged: true }])
  })

  it('a failed flag PUT does not unlock the item while the revealing PUT is still queued; its own failure does', async () => {
    const { exams } = setup()
    const pending = gated(exams)
    await open(exams, random(5, { feedback: 'each' }))
    press('f')
    await waitFor(() => expect(pending).toHaveLength(1))
    fireEvent.click(options()[1])
    await act(async () => pending[0].fail(new Error('sin conexión')))
    await waitFor(() => expect(pending).toHaveLength(2))
    expect(allDisabled()).toBe(true)

    await act(async () => pending[1].fail(new Error('sin conexión')))
    await waitFor(() => expect(options().some((o) => o.getAttribute('aria-disabled') === 'true')).toBe(false))
  })
})

describe('RunnerPage: a manual submit in flight when the clock hits 0 (R8)', () => {
  const fakeTime = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date', 'performance'] })
  const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

  async function openAlmostOver() {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(1), 1)
    clock.advance(59)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    return { exams, attempt }
  }

  it('the manual submit fails after 0: the auto-submit takes over and opens the result', async () => {
    const { exams, attempt } = await openAlmostOver()
    let fail: (e: Error) => void = () => {}
    const original = exams.submitAttempt.bind(exams)
    const submit = vi.spyOn(exams, 'submitAttempt').mockImplementationOnce(() => new Promise((_, reject) => (fail = reject)))
    submit.mockImplementation((id) => original(id))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('You have 5 unanswered. Submit?')).getByRole('button', { name: 'Yes, submit' }))
    await advance(2000)
    expect(submit).toHaveBeenCalledTimes(1)
    expect(currentLocation()).not.toMatch(/result/)

    await act(async () => fail(new Error('el servidor no responde')))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
    expect(submit).toHaveBeenCalledTimes(2)
  })

  it('the user cancels the unsaved-answers question after 0: the auto-submit takes over and the result shows the unsaved count', async () => {
    const { exams, attempt } = await openAlmostOver()
    const pending = gated(exams)
    const submit = vi.spyOn(exams, 'submitAttempt')
    fireEvent.click(options()[0])
    await settle()
    expect(pending).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('You have 4 unanswered. Submit?')).getByRole('button', { name: 'Yes, submit' }))
    await advance(2000)
    await act(async () => pending[0].fail(new Error('sin conexión')))
    await settle()
    expect(pending).toHaveLength(2)
    await act(async () => pending[1].fail(new Error('sin conexión')))
    const unsaved = await findDialog('Some answers are not saved. Submit anyway?')
    expect(submit).not.toHaveBeenCalled()

    fireEvent.click(within(unsaved).getByRole('button', { name: 'Cancel' }))
    await settle()
    expect(pending).toHaveLength(3)
    await act(async () => pending[2].fail(new Error('sin conexión')))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
    expect(submit).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('1 answer could not be saved')).toBeTruthy()
  })
})

describe('RunnerPage: nothing is enqueued while submitting (R9)', () => {
  const flagButton = () => screen.getByRole('button', { name: 'Flag for review' }) as HTMLButtonElement

  it('a click on an option while the submit waits for a save in flight sends no PUT, and the options are disabled', async () => {
    const { exams } = setup()
    const pending = gated(exams)
    await open(exams, random(1))
    fireEvent.click(options()[0])
    await waitFor(() => expect(pending).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('Submit the practice exam?')).getByRole('button', { name: 'Yes, submit' }))
    await waitFor(() => expect(options().every((o) => o.getAttribute('aria-disabled') === 'true')).toBe(true))

    fireEvent.click(options()[1])
    expect(checked()).toEqual([options()[0]])
    await act(async () => pending[0].release())
    await settle()
    expect(pending).toHaveLength(1)
  })

  it('F and the flag button do nothing while submitting', async () => {
    const { exams } = setup()
    const pending = gated(exams)
    await open(exams, random(1))
    fireEvent.click(options()[0])
    await waitFor(() => expect(pending).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('Submit the practice exam?')).getByRole('button', { name: 'Yes, submit' }))
    await waitFor(() => expect(flagButton().disabled).toBe(true))

    press('f')
    await act(async () => pending[0].release())
    await settle()
    expect(pending).toHaveLength(1)
  })

  it('a click on an option while the submit request itself is pending sends no PUT', async () => {
    const { exams } = setup()
    const put = vi.spyOn(exams, 'answerItem')
    vi.spyOn(exams, 'submitAttempt').mockImplementation(() => new Promise(() => {}))
    await open(exams, random(2))
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('You have 2 unanswered. Submit?')).getByRole('button', { name: 'Yes, submit' }))
    await waitFor(() => expect(options().every((o) => o.getAttribute('aria-disabled') === 'true')).toBe(true))
    fireEvent.click(options()[0])
    await settle()
    expect(put).not.toHaveBeenCalled()
  })
})

describe('RunnerPage: failed saves are a set, retried before submitting (R3)', () => {
  const fakeTime = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date', 'performance'] })

  async function answerTwoFailing(exams: InMemoryExamsAdapter) {
    vi.spyOn(exams, 'answerItem').mockRejectedValue(new Error('sin conexión'))
    fireEvent.click(options()[0])
    fireEvent.click(cell(2))
    fireEvent.click(options()[0])
    await screen.findByText('Could not save questions 1, 2')
  }

  it('two failed items are both listed in one toast, and "Retry" resends both', async () => {
    const { exams } = setup()
    await open(exams, random(5))
    await answerTwoFailing(exams)
    const put = vi.mocked(exams.answerItem)
    put.mockClear()
    put.mockResolvedValue({ position: 0, selected: ['A'], flagged: false })
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(put).toHaveBeenCalledTimes(2))
    expect(put.mock.calls.map((c) => c[1]).sort()).toEqual([0, 1])
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })

  it('a manual submit retries the failed saves once first; when they now succeed it goes straight to the result', async () => {
    const { exams } = setup()
    const put = vi.spyOn(exams, 'answerItem').mockRejectedValueOnce(new Error('sin conexión'))
    const attempt = await open(exams, random(1))
    fireEvent.click(options()[0])
    await screen.findByText('Could not save question 1')
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('Submit the practice exam?')).getByRole('button', { name: 'Yes, submit' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
    expect(put).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(/could not (be )?saved?/i)).toBeNull()
  })

  it('a manual submit with saves still failing asks again, listing them; confirming submits and the result says how many were lost', async () => {
    const { exams } = setup()
    const submit = vi.spyOn(exams, 'submitAttempt')
    const attempt = await open(exams, random(5))
    await answerTwoFailing(exams)
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('You have 3 unanswered. Submit?')).getByRole('button', { name: 'Yes, submit' }))
    const unsaved = await findDialog('Some answers are not saved. Submit anyway?')
    expect(unsaved.textContent).toContain('Unsaved questions: 1, 2')
    expect(submit).not.toHaveBeenCalled()
    fireEvent.click(within(unsaved).getByRole('button', { name: 'Yes, submit' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
    expect(submit).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('2 answers could not be saved')).toBeTruthy()
  })

  it('cancelling the unsaved-answers question keeps the attempt open and submits nothing', async () => {
    const { exams } = setup()
    const submit = vi.spyOn(exams, 'submitAttempt')
    await open(exams, random(1))
    vi.spyOn(exams, 'answerItem').mockRejectedValue(new Error('sin conexión'))
    fireEvent.click(options()[0])
    await screen.findByText('Could not save question 1')
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    fireEvent.click(within(await findDialog('Submit the practice exam?')).getByRole('button', { name: 'Yes, submit' }))
    fireEvent.click(within(await findDialog('Some answers are not saved. Submit anyway?')).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(submit).not.toHaveBeenCalled()
    expect(currentLocation()).not.toMatch(/result/)
  })

  it('the auto-submit at 0 retries the failed saves, then submits anyway and the result shows the notice', async () => {
    fakeTime()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(1), 1)
    clock.advance(58)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await screen.findByText(/^Question \d+ of \d+$/)
    const put = vi.spyOn(exams, 'answerItem').mockRejectedValue(new Error('sin conexión'))
    fireEvent.click(options()[0])
    await screen.findByText('Could not save question 1')
    const submit = vi.spyOn(exams, 'submitAttempt')
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    await waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
    expect(put).toHaveBeenCalledTimes(2)
    expect(submit).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('1 answer could not be saved')).toBeTruthy()
  })
})

describe('RunnerPage: multi under feedback each (R5)', () => {
  const multi = () => simpleQuestion('m1', 0, [], { type: 'multi', options: ['A', 'B', 'C', 'D'].map((label, i) => ({ label, text: `m ${label}`, correct: i < 2 })) })

  it('shows "Choose 2 options" with how many remain until N are chosen, then the hint goes away', async () => {
    const { exams } = setup({ questions: [multi()] })
    await open(exams, random(1, { feedback: 'each' }))
    expect(screen.getByText('Choose 2 options · 2 to go')).toBeTruthy()
    fireEvent.click(options()[0])
    expect(screen.getByText('Choose 2 options · 1 to go')).toBeTruthy()
    fireEvent.click(options()[1])
    expect(screen.queryByText(/^Choose 2 options/)).toBeNull()
  })

  it('a partial selection is never saved and the cell stays "unanswered"', async () => {
    const { exams } = setup({ questions: [multi()] })
    const put = vi.spyOn(exams, 'answerItem')
    await open(exams, random(1, { feedback: 'each' }))
    fireEvent.click(options()[0])
    await settle()
    expect(put).not.toHaveBeenCalled()
    expect(cell(1).getAttribute('aria-label')).toBe('Question 1, unanswered')
  })

  it('under feedback end there is no hint and a partial selection is saved', async () => {
    const { exams } = setup({ questions: [multi()] })
    const put = vi.spyOn(exams, 'answerItem')
    await open(exams, random(1))
    expect(screen.queryByText(/^Choose 2 options/)).toBeNull()
    fireEvent.click(options()[0])
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
  })
})

describe('RunnerPage: keyboard after navigation (R4)', () => {
  it('→ then 2 selects option B of the next question, with no focus inside the question', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    press('ArrowRight')
    expect(header()).toBe('Question 2 of 15')
    press('2')
    expect(checked()).toEqual([options()[1]])
  })

  it('1–6 beyond the options, or with a modifier, do nothing', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    press('6')
    fireEvent.keyDown(document.body, { key: '1', ctrlKey: true })
    expect(checked()).toEqual([])
  })

  it('a key held down toggles F once, not on every repeat', async () => {
    const { exams } = setup()
    await open(exams, random(15))
    press('f')
    fireEvent.keyDown(document.body, { key: 'f', repeat: true })
    fireEvent.keyDown(document.body, { key: 'f', repeat: true })
    expect(screen.getByRole('button', { name: 'Flag for review' }).getAttribute('aria-pressed')).toBe('true')
  })
})

describe('RunnerPage: the clock and the submit at 0 (R6)', () => {
  const fakeAll = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date', 'performance'] })
  const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
  // Testing Library's own async helpers wait on a real setTimeout(0); with setTimeout faked only vi.waitFor works.

  it('a sync whose request started before the latest applied one is ignored, even if it answers later', async () => {
    fakeAll()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(3), 1)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await vi.waitFor(() => screen.getByText(/^Question \d+ of \d+$/))
    const original = exams.getAttempt.bind(exams)
    const releases: Array<() => void> = []
    // The server answers at request time; only the delivery waits for the test.
    vi.spyOn(exams, 'getAttempt').mockImplementation((id) => {
      const answer = original(id)
      return new Promise((resolve, reject) => releases.push(() => answer.then(resolve, reject)))
    })
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    await advance(10)
    clock.advance(30)
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect(releases).toHaveLength(2)
    // The later request answers first (150 s left) ...
    await act(async () => releases[1]())
    expect(screen.getByRole('timer').textContent).toBe('2:30')
    // ... then the earlier one arrives with a staler 180 s: it must not move the clock back.
    await act(async () => releases[0]())
    expect(screen.getByRole('timer').textContent).toBe('2:30')
  })

  it('a failed submit at 0 is retried after 1 s, 2 s and 4 s, then the error is shown and it stops', async () => {
    fakeAll()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(1), 1)
    clock.advance(59)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await vi.waitFor(() => screen.getByText(/^Question \d+ of \d+$/))
    const at: number[] = []
    vi.spyOn(exams, 'submitAttempt').mockImplementation(async () => {
      at.push(performance.now())
      throw new Error('el servidor no responde')
    })
    await advance(70_000)
    expect(at).toHaveLength(4)
    // The first call is at 0; each retry waits 1 s, 2 s, 4 s after the previous failure.
    expect(at.slice(1).map((t, i) => t - at[i])).toEqual([1000, 2000, 4000])
    expect(screen.getByText(/el servidor no responde/)).toBeTruthy()
  })

  it('a retry that succeeds opens the result and stops retrying', async () => {
    fakeAll()
    const { clock, exams } = setup()
    const attempt = await exams.startAttempt(EXAM_ID, timed(1), 1)
    clock.advance(59)
    renderAt(`/studies/attempts/${attempt.id}`, undefined, exams)
    await vi.waitFor(() => screen.getByText(/^Question \d+ of \d+$/))
    const submit = vi.spyOn(exams, 'submitAttempt').mockRejectedValueOnce(new Error('red caída'))
    await advance(1000)
    await advance(1000)
    await vi.waitFor(() => expect(currentLocation()).toBe(`/studies/attempts/${attempt.id}/result`))
    expect(submit).toHaveBeenCalledTimes(2)
  })
})
