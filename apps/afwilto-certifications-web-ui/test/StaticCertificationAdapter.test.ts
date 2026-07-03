import { describe, it, expect } from 'vitest'
import { StaticCertificationAdapter } from '../src/infrastructure/adapters/static/StaticCertificationAdapter'
import { CERTIFICATIONS } from '../src/infrastructure/data/certifications'

const service = new StaticCertificationAdapter()

describe('StaticCertificationAdapter', () => {
  it('getCatalog returns only obtained certs sorted newest-first (AC-1)', async () => {
    const catalog = await service.getCatalog()
    expect(catalog.length).toBeGreaterThan(0)
    for (const cert of catalog) {
      expect(cert.status).toBe('obtained')
      expect(cert.obtainedDate).toBeTruthy()
    }
    const dates = catalog.map((c) => c.obtainedDate!)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('getRoadmap returns in-progress before planned, never obtained (AC-2)', async () => {
    const roadmap = await service.getRoadmap()
    expect(roadmap.length).toBeGreaterThan(0)
    expect(roadmap.some((c) => c.status === 'obtained')).toBe(false)
    const lastInProgress = roadmap.map((c) => c.status).lastIndexOf('in-progress')
    const firstPlanned = roadmap.map((c) => c.status).indexOf('planned')
    if (lastInProgress !== -1 && firstPlanned !== -1) {
      expect(lastInProgress).toBeLessThan(firstPlanned)
    }
  })

  it('getBySlug resolves a known cert and null for unknown (AC-3)', async () => {
    const known = CERTIFICATIONS[0].slug
    expect((await service.getBySlug(known))?.slug).toBe(known)
    expect(await service.getBySlug('definitely-not-a-cert')).toBeNull()
  })

  it('dataset slugs are unique (AC-4)', () => {
    const slugs = CERTIFICATIONS.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
