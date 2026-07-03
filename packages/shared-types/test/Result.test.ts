import { describe, it, expect } from 'vitest'
import { ok, err, type Result } from '@afwilto/shared-types'

describe('Result (AC-1)', () => {
  it('ok(data) produces a success result carrying the data', () => {
    const result = ok(5)
    expect(result).toEqual({ success: true, data: 5 })
  })

  it('err(error) produces a failure result carrying the error', () => {
    const boom = new Error('boom')
    const result = err(boom)
    expect(result).toEqual({ success: false, error: boom })
  })

  it('narrows on the success discriminant', () => {
    const result: Result<number> = ok(42)
    if (result.success) {
      expect(result.data).toBe(42)
    } else {
      expect.unreachable('ok() must narrow to the success branch')
    }
  })

  it('err defaults the error type to Error and preserves custom error types', () => {
    const result: Result<never, string> = err('validation failed')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('validation failed')
    }
  })
})
