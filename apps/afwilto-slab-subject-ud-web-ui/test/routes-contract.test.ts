import { describe, it, expect } from 'vitest'
import { routes } from '@/router'

describe('UD route table contract (AC-1)', () => {
  it('contains only relative paths (mountable under any prefix)', () => {
    for (const route of routes) {
      expect(route.path?.startsWith('/'), `path "${route.path}" must be relative`).toBe(false)
    }
  })

  it('contains the landing, all built subjects, the param fallback and the catch-all', () => {
    const paths = routes.map((r) => r.path)
    expect(paths).toContain('')
    for (const slug of [
      'basic-programming',
      'programming-models-2',
      'object-oriented-programming',
      'artificial-intelligence-1',
      'operative-systems',
      'databases-ii',
      'network-communication-1',
      'network-communication-2',
      'network-communication-3',
      'operations-research-1',
      'physics-lab',
      'computer-science-1',
      'computer-science-2',
      'computer-science-3',
    ]) {
      expect(paths, `missing subject route ${slug}`).toContain(slug)
    }
    expect(paths).toContain(':subjectSlug')
    expect(paths).toContain('*')
  })

  it('lists static routes before the :subjectSlug wildcard', () => {
    const paths = routes.map((r) => r.path)
    expect(paths.indexOf('computer-science-1')).toBeLessThan(paths.indexOf(':subjectSlug'))
  })
})
