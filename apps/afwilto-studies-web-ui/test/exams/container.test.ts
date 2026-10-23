import { describe, it, expect, vi, afterEach } from 'vitest'

// Spec 18 slice 07 §1.1: examsService follows the same rule as studiesService.
async function loadContainer() {
  vi.resetModules()
  return (await import('../../src/di/container')).container
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('ServiceContainer.examsService', () => {
  it('is the HTTP adapter when VITE_API_URL is set', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8084/api/v1')
    const container = await loadContainer()
    const { ExamsHttpAdapter } = await import('../../src/exams/infrastructure/http/ExamsHttpAdapter')
    expect(container.examsService).toBeInstanceOf(ExamsHttpAdapter)
  })

  it('is the in-memory adapter when VITE_API_URL is empty', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const container = await loadContainer()
    const { InMemoryExamsAdapter } = await import('../../src/exams/infrastructure/memory/InMemoryExamsAdapter')
    expect(container.examsService).toBeInstanceOf(InMemoryExamsAdapter)
  })
})
