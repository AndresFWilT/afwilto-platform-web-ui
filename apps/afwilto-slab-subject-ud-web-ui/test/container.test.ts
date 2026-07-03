import { describe, it, expect } from 'vitest'
import { container } from '@/di/container'

describe('DI container (AC-6)', () => {
  it('instantiates every registered service', () => {
    const entries = Object.entries(container)
    expect(entries.length).toBeGreaterThanOrEqual(30)
    for (const [name, service] of entries) {
      expect(service, `service "${name}" must be instantiated`).toBeTruthy()
    }
  })
})
