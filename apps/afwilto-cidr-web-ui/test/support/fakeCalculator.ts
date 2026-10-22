import { vi } from 'vitest'
import type { ICidrCalculator } from '../../src/cidr/application/ports'
import { aggregation, ipv4Range, ipv4Table, ipv6Table, summary } from './fixtures'

/** Canned-response port double; every method is a vi.fn you can re-script. */
export function fakeCalculator(overrides: Partial<ICidrCalculator> = {}) {
  return {
    calculateRange: vi.fn(() => Promise.resolve(ipv4Range)),
    summarizeRange: vi.fn(() => Promise.resolve(summary)),
    aggregate: vi.fn(() => Promise.resolve(aggregation)),
    prefixTable: vi.fn((family: 'ipv4' | 'ipv6') => Promise.resolve(family === 'ipv4' ? ipv4Table : ipv6Table)),
    ...overrides,
  } satisfies ICidrCalculator
}

/** A promise you resolve from the test, to observe the pending state. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
