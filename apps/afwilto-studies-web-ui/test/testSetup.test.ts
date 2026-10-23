import { describe, it, expect } from 'vitest'
import { getConfig } from '@testing-library/react'
import config from '../vitest.config'

// Fix 15: the NoteEditor/NotePage/Runner tests flaked under load on the 1 s default; one place sets the budget.
describe('test setup (flaky-test budget)', () => {
  it('Testing Library waits up to 5 s for async queries', () => {
    expect(getConfig().asyncUtilTimeout).toBe(5000)
  })

  it('vitest registers test/setup.ts and allows 15 s per test', () => {
    expect(config.test?.setupFiles).toEqual(['./test/setup.ts'])
    expect(config.test?.testTimeout).toBe(15000)
  })
})
