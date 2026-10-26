import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreSummary } from '../../src/features/review-attempt/ui/organisms/ScoreSummary'
import { formatScore } from '../../src/shared/lib/format'
import type { AttemptResult } from '../../src/exams/domain'

const result = (scorePercent: number, passed: boolean | null): AttemptResult => ({ scorePercent, passed, correctCount: 1, total: 2, durationSeconds: 60, breakdown: [] })

describe('formatScore (R7): the server sends two decimals, the page shows them', () => {
  it.each([
    [69.96, '69.96%'],
    [70, '70.00%'],
    [76.92, '76.92%'],
    [0, '0.00%'],
    [100, '100.00%'],
    [33.3, '33.30%'],
  ])('%s is %s', (value, text) => expect(formatScore(value)).toBe(text))
})

describe('ScoreSummary (R7)', () => {
  it('69.96 against a pass mark of 70 reads "69.96%" and "Not passed", never "70%"', () => {
    render(<ScoreSummary result={result(69.96, false)} />)
    expect(screen.getByText('69.96%')).toBeTruthy()
    expect(screen.getByText('Not passed')).toBeTruthy()
    expect(screen.queryByText(/^70/)).toBeNull()
  })

  it('70 reads "70.00%" and "Passed"', () => {
    render(<ScoreSummary result={result(70, true)} />)
    expect(screen.getByText('70.00%')).toBeTruthy()
    expect(screen.getByText('Passed')).toBeTruthy()
  })
})
