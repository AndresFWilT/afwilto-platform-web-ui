import { describe, it, expect } from 'vitest'
import { validateExamInput, type ExamFormValues } from '../../src/exams/domain'

const VALID: ExamFormValues = { name: 'SAA-C03', questionCount: '65', timeLimitMin: '130', passPercent: '72' }

describe('validateExamInput (BR-E2, S08-1)', () => {
  it('parses valid values and trims the name', () => {
    expect(validateExamInput({ ...VALID, name: '  SAA-C03  ' })).toEqual({
      errors: {},
      value: { name: 'SAA-C03', questionCount: 65, timeLimitMin: 130, passPercent: 72 },
    })
  })

  it('an empty or blank name is "The name is required" and yields no value', () => {
    for (const name of ['', '   ']) {
      const check = validateExamInput({ ...VALID, name })
      expect(check.errors).toEqual({ name: 'The name is required' })
      expect(check.value).toBeUndefined()
    }
  })

  it('a name over 120 characters is refused, 120 is accepted', () => {
    expect(validateExamInput({ ...VALID, name: 'x'.repeat(121) }).errors.name).toBe('The name can have up to 120 characters')
    expect(validateExamInput({ ...VALID, name: 'x'.repeat(120) }).errors).toEqual({})
  })

  it.each([
    { field: 'questionCount', bad: ['0', '201', '', 'abc', '1.5'], good: ['1', '200'], message: 'Must be between 1 and 200' },
    { field: 'timeLimitMin', bad: ['0', '601', '-3'], good: ['1', '600'], message: 'Must be between 1 and 600' },
    { field: 'passPercent', bad: ['0', '101'], good: ['1', '100'], message: 'Must be between 1 and 100' },
  ] as const)('$field accepts $good and refuses $bad', ({ field, bad, good, message }) => {
    for (const value of bad) expect(validateExamInput({ ...VALID, [field]: value }).errors[field]).toBe(message)
    for (const value of good) expect(validateExamInput({ ...VALID, [field]: value }).errors[field]).toBeUndefined()
  })

  it('reports every bad field at once', () => {
    expect(Object.keys(validateExamInput({ name: '', questionCount: '0', timeLimitMin: '0', passPercent: '0' }).errors)).toEqual([
      'name',
      'questionCount',
      'timeLimitMin',
      'passPercent',
    ])
  })
})
