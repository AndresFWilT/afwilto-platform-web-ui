import { describe, it, expect } from 'vitest'
import { examPaceMinutes, inferWeights, toRevealInfo, toViewQuestion, unclassifiedCount, weightsSum } from '../../src/exams/domain'
import { examFixture, questionFixture, CAT, CLS } from './examFixtures'

describe('unclassifiedCount (S08-7)', () => {
  it('is the bank size minus the questions linked to the primary classification', () => {
    const exam = examFixture({ questionTotal: 13 })
    exam.classifications[0].categories[0].questionCount = 5
    exam.classifications[0].categories[1].questionCount = 3
    exam.classifications[0].categories[2].questionCount = 2
    expect(unclassifiedCount(exam)).toBe(3)
  })

  it('is the whole bank while the exam has no classification yet', () => {
    expect(unclassifiedCount(examFixture({ questionTotal: 4, classifications: [] }))).toBe(4)
  })

  it('only counts the primary classification, not the one at position 1', () => {
    const exam = examFixture({ questionTotal: 4 })
    exam.classifications[1].categories[0].questionCount = 4
    expect(unclassifiedCount(exam)).toBe(4)
  })
})

describe('inferWeights: largest remainder (FR-3.4, AC-6)', () => {
  it.each([
    { counts: [5, 3, 3], weights: [46, 27, 27] },
    { counts: [1, 1, 1], weights: [34, 33, 33] },
    { counts: [10, 0, 0], weights: [100, 0, 0] },
    { counts: [0, 0], weights: [0, 0] },
    { counts: [], weights: [] },
    { counts: [2, 1], weights: [67, 33] },
  ])('$counts gives $weights', ({ counts, weights }) => {
    expect(inferWeights(counts)).toEqual(weights)
  })

  it('always sums to 100 when anything is counted', () => {
    for (const counts of [[7, 7, 7, 7, 7, 7, 7], [1, 2, 3, 4, 5], [13, 1]]) {
      expect(inferWeights(counts).reduce((a, b) => a + b, 0)).toBe(100)
    }
  })
})

describe('weightsSum (S08-4)', () => {
  it('adds the weights and counts a blank as 0', () => {
    expect(weightsSum([40, 40, 19])).toBe(99)
    expect(weightsSum([40, null, 20])).toBe(60)
    expect(weightsSum([])).toBe(0)
  })
})

describe('examPaceMinutes (FR-3.5)', () => {
  it('is timeLimitMin over questionCount', () => {
    expect(examPaceMinutes({ timeLimitMin: 130, questionCount: 65 })).toBe(2)
    expect(examPaceMinutes({ timeLimitMin: 45, questionCount: 50 })).toBeCloseTo(0.9)
  })
})

describe('question view mapping (reveal mode of the preview and the bank)', () => {
  const question = questionFixture('k1', [], {
    type: 'multi',
    stem: 'Elige dos',
    explanation: 'Porque sí.',
    options: [
      { label: 'A', text: 'a', correct: true, rationale: 'ra' },
      { label: 'B', text: 'b', correct: false },
      { label: 'C', image: 'media:' + 'a1'.repeat(32), alt: 'dibujo', correct: true, rationale: 'rc' },
    ],
  })

  it('toViewQuestion carries no answer key and counts the correct options as N', () => {
    const view = toViewQuestion(question)
    expect(view).toEqual({
      type: 'multi',
      stem: 'Elige dos',
      chooseCount: 2,
      options: [
        { label: 'A', text: 'a', image: undefined, alt: undefined },
        { label: 'B', text: 'b', image: undefined, alt: undefined },
        { label: 'C', text: undefined, image: 'media:' + 'a1'.repeat(32), alt: 'dibujo' },
      ],
    })
    expect(JSON.stringify(view)).not.toContain('correct')
    expect(JSON.stringify(view)).not.toContain('rationale')
  })

  it('toRevealInfo lists the correct labels, the rationales that exist and the explanation', () => {
    expect(toRevealInfo(question)).toEqual({ correctLabels: ['A', 'C'], rationales: { A: 'ra', C: 'rc' }, explanation: 'Porque sí.' })
  })
})

describe('fixtures sanity', () => {
  it('the exam fixture names its ids', () => {
    expect(examFixture().classifications.map((c) => c.id)).toEqual([CLS.dominio, CLS.servicio])
    expect(examFixture().classifications[0].categories[0].id).toBe(CAT.seguridad)
  })
})
