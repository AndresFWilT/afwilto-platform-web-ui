import { describe, it, expect } from 'vitest'
import {
  apportion,
  answerPayload,
  buildBreakdown,
  buildPreviewConfig,
  buildSessionConfig,
  cellLabel,
  cellState,
  editMinutes,
  filterReview,
  formatClock,
  percentOf,
  initialSessionForm,
  itemView,
  resetMinutes,
  unansweredCount,
  withSuggestedMinutes,
  type ReviewItem,
  type SessionForm,
} from '../../src/exams/domain'
import { CAT, CLS, examFixture } from './examFixtures'

describe('apportion: largest remainder (AC-14)', () => {
  it('splits 65 over weights 30/26/24/20 into 19/17/16/13', () => {
    expect(apportion(65, [30, 26, 24, 20])).toEqual([19, 17, 16, 13])
  })

  it('splits 100 over counts 5/3/3 into 46/27/27 (AC-6 shape)', () => {
    expect(apportion(100, [5, 3, 3])).toEqual([46, 27, 27])
  })

  it('gives zero to zero weights and everything to the rest', () => {
    expect(apportion(10, [0, 5, 5])).toEqual([0, 5, 5])
  })

  it('gives all zeros when every weight is zero', () => {
    expect(apportion(10, [0, 0])).toEqual([0, 0])
  })

  it('breaks equal remainders by position', () => {
    expect(apportion(2, [1, 1, 1])).toEqual([1, 1, 0])
  })
})

describe('navigator cells (S09-6)', () => {
  const item = (answered: boolean, flagged: boolean, position = 2) => ({ position, answered, flagged })

  it('has the four states: blank, answered, flagged and both', () => {
    expect(cellState(item(false, false))).toBe('blank')
    expect(cellState(item(true, false))).toBe('answered')
    expect(cellState(item(false, true))).toBe('flagged')
    expect(cellState(item(true, true))).toBe('answered-flagged')
  })

  it('labels an answered, flagged item "Question 3, answered, flagged" (0-based position 2)', () => {
    expect(cellLabel(item(true, true))).toBe('Question 3, answered, flagged')
  })

  it('labels the other states in words, never by colour', () => {
    expect(cellLabel(item(false, false, 6))).toBe('Question 7, unanswered')
    expect(cellLabel(item(true, false, 6))).toBe('Question 7, answered')
    expect(cellLabel(item(false, true, 6))).toBe('Question 7, unanswered, flagged')
  })
})

describe('runner helpers', () => {
  it('counts the unanswered items (S09-8)', () => {
    expect(unansweredCount([{ answered: true }, { answered: false }, { answered: false }])).toBe(2)
    expect(unansweredCount([])).toBe(0)
  })

  it('formats the countdown as m:ss, and h:mm:ss from one hour (S09-4)', () => {
    expect(formatClock(100)).toBe('1:40')
    expect(formatClock(130)).toBe('2:10')
    expect(formatClock(5)).toBe('0:05')
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(3600)).toBe('1:00:00')
    expect(formatClock(7800)).toBe('2:10:00')
    expect(formatClock(-3)).toBe('0:00')
  })

  it('draws a single item with chooseCount 1 and a multi item with its N', () => {
    const options = [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }, { label: 'C', text: 'c' }]
    expect(itemView({ type: 'single', stem: 's', options })).toEqual({ type: 'single', stem: 's', chooseCount: 1, options })
    expect(itemView({ type: 'multi', stem: 's', options, chooseCount: 2 }).chooseCount).toBe(2)
  })
})

describe('answerPayload: what the PUT carries', () => {
  const single = { type: 'single' as const, chooseCount: undefined, selected: ['B'], flagged: false }
  const multi = (selected: string[]) => ({ type: 'multi' as const, chooseCount: 2, selected, flagged: true })

  it('sends the selection and the flag as they are under feedback "end"', () => {
    expect(answerPayload(single, [], 'end')).toEqual({ selected: ['B'], flagged: false })
    expect(answerPayload(multi(['A']), [], 'end')).toEqual({ selected: ['A'], flagged: true })
  })

  it('sends a single selection at once under feedback "each"', () => {
    expect(answerPayload(single, [], 'each')).toEqual({ selected: ['B'], flagged: false })
  })

  it('holds back a partial multi selection under "each": the PUT carries the last saved one, so nothing is revealed early', () => {
    expect(answerPayload(multi(['A']), [], 'each')).toEqual({ selected: [], flagged: true })
    expect(answerPayload(multi(['A']), ['C'], 'each')).toEqual({ selected: ['C'], flagged: true })
  })

  it('sends a complete multi selection under "each"', () => {
    expect(answerPayload(multi(['A', 'C']), [], 'each')).toEqual({ selected: ['A', 'C'], flagged: true })
  })
})

const review = (position: number, correct: boolean, flagged: boolean, categories: Array<[string, string]>): ReviewItem => ({
  position,
  stem: `q${position}`,
  type: 'single',
  options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }],
  selected: correct ? ['A'] : ['B'],
  flagged,
  reveal: { correct, correctLabels: ['A'], rationales: {} },
  categories: categories.map(([classification, name]) => ({ classification, name })),
})

describe('buildBreakdown (S06b-5 shape)', () => {
  it('lists domain B at 0/2 before domain A at 2/2, per classification', () => {
    const items = [
      review(0, true, false, [['Dominio', 'A'], ['Servicio', 'S3']]),
      review(1, true, false, [['Dominio', 'A'], ['Servicio', 'VPC']]),
      review(2, false, false, [['Dominio', 'B'], ['Servicio', 'S3']]),
      review(3, false, false, [['Dominio', 'B']]),
    ]
    expect(buildBreakdown(items)).toEqual([
      {
        classification: 'Dominio',
        categories: [
          { name: 'B', correct: 0, total: 2, percent: 0 },
          { name: 'A', correct: 2, total: 2, percent: 100 },
        ],
      },
      {
        classification: 'Servicio',
        categories: [
          { name: 'S3', correct: 1, total: 2, percent: 50 },
          { name: 'VPC', correct: 1, total: 1, percent: 100 },
        ],
      },
    ])
  })

  it('breaks percent ties by name and rounds the percent to two decimals', () => {
    const items = [
      review(0, true, false, [['D', 'Zeta']]),
      review(1, true, false, [['D', 'Alfa']]),
      review(2, true, false, [['D', 'Beta']]),
      review(3, false, false, [['D', 'Beta']]),
      review(4, false, false, [['D', 'Beta']]),
    ]
    const [d] = buildBreakdown(items)
    expect(d.categories.map((c) => [c.name, c.percent])).toEqual([['Beta', 33.33], ['Alfa', 100], ['Zeta', 100]])
  })

  it('is empty when no item has a category', () => {
    expect(buildBreakdown([review(0, true, false, [])])).toEqual([])
  })
})

describe('filterReview (S09-10)', () => {
  const items = [review(0, true, false, []), review(1, false, false, []), review(2, true, true, []), review(3, false, true, [])]

  it('"incorrect" keeps only the items answered wrong or not at all', () => {
    expect(filterReview(items, 'incorrect').map((i) => i.position)).toEqual([1, 3])
  })

  it('"flagged" keeps the flagged ones, right or wrong', () => {
    expect(filterReview(items, 'flagged').map((i) => i.position)).toEqual([2, 3])
  })

  it('"all" keeps everything in order', () => {
    expect(filterReview(items, 'all').map((i) => i.position)).toEqual([0, 1, 2, 3])
  })
})

describe('session form → config (FR-7)', () => {
  const exam = examFixture()
  const base = (): SessionForm => initialSessionForm(exam)
  const custom = (changes: Partial<SessionForm>): SessionForm => ({ ...base(), mode: 'custom', ...changes })

  it('starts as the real simulation, with the primary classification chosen and a custom draft untimed, feedback at the end', () => {
    expect(base()).toMatchObject({ mode: 'simulation', classificationId: CLS.dominio, timing: 'untimed', feedback: 'end', minutesEdited: false })
  })

  it('a simulation sends the selection only: timing and feedback are forced by the server (locked_by_simulation)', () => {
    expect(buildSessionConfig(base())).toEqual({ selection: { kind: 'simulation' } })
    expect(buildPreviewConfig(base())).toEqual({ selection: { kind: 'simulation' } })
  })

  it('random: count between 1 and 200', () => {
    expect(buildSessionConfig(custom({ selectionKind: 'random', randomCount: '40' }))).toEqual({
      selection: { kind: 'random', count: 40 },
      timing: { kind: 'untimed' },
      feedback: 'end',
    })
    for (const bad of ['', '0', '201', '2.5', 'x']) expect(buildSessionConfig(custom({ selectionKind: 'random', randomCount: bad }))).toBeNull()
  })

  it('categories: needs at least one category; "todas" or a count', () => {
    const form = custom({ selectionKind: 'categories', classificationId: CLS.servicio, categoryIds: [CAT.vpc, CAT.s3], categoryScope: 'all' })
    expect(buildSessionConfig(form)).toEqual({
      selection: { kind: 'categories', classificationId: CLS.servicio, categoryIds: [CAT.vpc, CAT.s3], count: 'all' },
      timing: { kind: 'untimed' },
      feedback: 'end',
    })
    expect(buildSessionConfig({ ...form, categoryScope: 'count', categoryCount: '7' })?.selection).toMatchObject({ count: 7 })
    expect(buildSessionConfig({ ...form, categoryScope: 'count', categoryCount: '0' })).toBeNull()
    expect(buildSessionConfig({ ...form, categoryIds: [] })).toBeNull()
  })

  it('origin-set: needs a set', () => {
    expect(buildSessionConfig(custom({ selectionKind: 'origin-set', set: 'TD Timed Set 3', feedback: 'each' }))).toEqual({
      selection: { kind: 'origin-set', set: 'TD Timed Set 3' },
      timing: { kind: 'untimed' },
      feedback: 'each',
    })
    expect(buildSessionConfig(custom({ selectionKind: 'origin-set', set: '' }))).toBeNull()
  })

  it('timed: minutes between 1 and 600; the preview config never depends on the minutes', () => {
    const form = custom({ selectionKind: 'random', randomCount: '10', timing: 'timed', minutes: '45' })
    expect(buildSessionConfig(form)?.timing).toEqual({ kind: 'timed', minutes: 45 })
    for (const bad of ['', '0', '601', '1.5']) {
      expect(buildSessionConfig({ ...form, minutes: bad })).toBeNull()
      expect(buildPreviewConfig({ ...form, minutes: bad })).toEqual(buildPreviewConfig(form))
    }
    expect(buildPreviewConfig(form)).toEqual({ selection: { kind: 'random', count: 10 }, timing: { kind: 'untimed' }, feedback: 'end' })
  })
})

describe('suggested minutes vs. edited minutes (S09-1)', () => {
  const exam = examFixture()
  const form = (): SessionForm => ({ ...initialSessionForm(exam), mode: 'custom', timing: 'timed' })

  it('a preview fills the minutes while the owner has not touched them', () => {
    const filled = withSuggestedMinutes(form(), 30)
    expect(filled.minutes).toBe('30')
    expect(withSuggestedMinutes(filled, 42).minutes).toBe('42')
  })

  it('after the owner edits the minutes, later previews stop overwriting them', () => {
    const edited = editMinutes(withSuggestedMinutes(form(), 30), '45')
    expect(edited).toMatchObject({ minutes: '45', minutesEdited: true })
    expect(withSuggestedMinutes(edited, 42).minutes).toBe('45')
  })

  it('"restablecer sugerido" sets the suggestion and lets previews overwrite again', () => {
    const edited = editMinutes(form(), '45')
    const reset = resetMinutes(edited, 42)
    expect(reset).toMatchObject({ minutes: '42', minutesEdited: false })
    expect(withSuggestedMinutes(reset, 50).minutes).toBe('50')
  })

  it('an empty pool (suggestion 0) leaves the field empty instead of 0', () => {
    expect(withSuggestedMinutes(form(), 0).minutes).toBe('')
  })
})

describe('scoring mirrors the server: integer half-up on hundredths (contract 0.3.0, M1)', () => {
  it('percentOf(57, 20000) is 0.29 where float rounding gives 0.28', () => {
    expect(percentOf(57, 20000)).toBe(0.29)
    expect(percentOf(1, 3)).toBe(33.33)
    expect(percentOf(2, 3)).toBe(66.67)
    expect(percentOf(1, 32)).toBe(3.13)
    expect(percentOf(0, 0)).toBe(0)
    expect(percentOf(47, 65)).toBe(72.31)
  })

  it('buildBreakdown percent is that same value', () => {
    const items = [...Array.from({ length: 57 }, (_, i) => review(i, true, false, [['D', 'X']])), ...Array.from({ length: 19_943 }, (_, i) => review(57 + i, false, false, [['D', 'X']]))]
    expect(buildBreakdown(items)[0].categories[0].percent).toBe(0.29)
  })

  it('percent ties sort by name case-insensitively, then bytewise ("B" before "b")', () => {
    const items = ['b', 'B', 'a', 'Zed'].map((name, i) => review(i, true, false, [['D', name]]))
    expect(buildBreakdown(items)[0].categories.map((c) => c.name)).toEqual(['a', 'B', 'b', 'Zed'])
  })

  it('classifications are sorted by name', () => {
    const items = [review(0, true, false, [['Servicio', 'S3'], ['Dominio', 'A']])]
    expect(buildBreakdown(items).map((c) => c.classification)).toEqual(['Dominio', 'Servicio'])
  })
})
