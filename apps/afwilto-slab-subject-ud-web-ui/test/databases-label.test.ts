import { describe, it, expect } from 'vitest'
import { UD_SUBJECTS } from '@/pages/UniversidadDistrital/data'

// Spec 12 AC-5: the TeatrosUD project belongs to Database I; DB II has no project.
describe('UD Databases subject labelling (Spec 12 AC-5)', () => {
  const titles = UD_SUBJECTS.map((s) => s.title)

  it('exposes exactly one databases subject titled "Database I"', () => {
    const dbSubjects = UD_SUBJECTS.filter((s) => s.category === 'Databases')
    expect(dbSubjects).toHaveLength(1)
    expect(dbSubjects[0].title).toBe('Database I')
  })

  it('has no "Databases II" or duplicate "Database 1" entries', () => {
    expect(titles).not.toContain('Databases II')
    expect(titles).not.toContain('Database 1')
  })

  it('keeps the databases-ii slug (routes/pages untouched) — AC-6', () => {
    const entry = UD_SUBJECTS.find((s) => s.slug === 'databases-ii')
    expect(entry).toBeTruthy()
    expect(entry?.title).toBe('Database I')
  })
})
