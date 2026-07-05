import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryCertificationAdapter } from '../src/infrastructure/adapters/memory/InMemoryCertificationAdapter'
import type { ICertificationJourneyService } from '../src/application/ports'

describe('InMemoryCertificationAdapter behavioral contract', () => {
  let adapter: ICertificationJourneyService

  beforeEach(() => {
    adapter = new InMemoryCertificationAdapter()
  })

  // ── List ──────────────────────────────────────────────────────────────────

  it('GH-L1: empty list returns page with zero items and correct meta', async () => {
    const page = await adapter.list()
    expect(page.items).toHaveLength(0)
    expect(page.meta.totalItems).toBe(0)
    expect(page.meta.page).toBe(1)
    expect(page.meta.totalPages).toBe(1)
  })

  it('GH-L1: paginates correctly', async () => {
    for (let i = 1; i <= 5; i++) {
      await adapter.create({ name: `Cert ${i}` })
    }
    const page1 = await adapter.list({ page: 1, pageSize: 2 })
    expect(page1.items).toHaveLength(2)
    expect(page1.meta.totalItems).toBe(5)
    expect(page1.meta.totalPages).toBe(3)

    const page3 = await adapter.list({ page: 3, pageSize: 2 })
    expect(page3.items).toHaveLength(1)
  })

  it('GH-L2: filters by search (case-insensitive contains)', async () => {
    await adapter.create({ name: 'AWS Solutions Architect' })
    await adapter.create({ name: 'CKA Kubernetes' })
    const result = await adapter.list({ search: 'aws' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('AWS Solutions Architect')
  })

  it('GH-L2: filters by status', async () => {
    await adapter.create({ name: 'A', status: 'planned' })
    await adapter.create({ name: 'B', status: 'achieved' })
    const achieved = await adapter.list({ status: 'achieved' })
    expect(achieved.items).toHaveLength(1)
    expect(achieved.items[0].name).toBe('B')
  })

  it('GH-L2: filters by category prefix (exact and child paths)', async () => {
    await adapter.create({ name: 'A', categoryPath: 'Cloud/AWS' })
    await adapter.create({ name: 'B', categoryPath: 'Cloud/GCP' })
    await adapter.create({ name: 'C', categoryPath: 'DevOps' })
    const cloud = await adapter.list({ categoryPrefix: 'Cloud' })
    expect(cloud.items).toHaveLength(2)
    const aws = await adapter.list({ categoryPrefix: 'Cloud/AWS' })
    expect(aws.items).toHaveLength(1)
  })

  it('GH-L2: filters by year (intersects study period)', async () => {
    await adapter.create({ name: 'In 2025', studyStartDate: '2025-01-01', expectedExamDate: '2025-12-31' })
    await adapter.create({ name: 'In 2026', studyStartDate: '2026-03-01', expectedExamDate: '2026-09-30' })
    await adapter.create({ name: 'Only start', studyStartDate: '2024-06-01' })
    const year2025 = await adapter.list({ year: 2025 })
    expect(year2025.items.map(c => c.name)).toContain('In 2025')
    expect(year2025.items.map(c => c.name)).not.toContain('In 2026')
    const year2026 = await adapter.list({ year: 2026 })
    expect(year2026.items.map(c => c.name)).toContain('In 2026')
  })

  it('GH-L3: sorts by name ascending', async () => {
    await adapter.create({ name: 'Zeta' })
    await adapter.create({ name: 'Alpha' })
    const result = await adapter.list({ sortBy: 'name', sortOrder: 'asc' })
    expect(result.items[0].name).toBe('Alpha')
    expect(result.items[1].name).toBe('Zeta')
  })

  it('GH-L3: sorts by name descending', async () => {
    await adapter.create({ name: 'Zeta' })
    await adapter.create({ name: 'Alpha' })
    const result = await adapter.list({ sortBy: 'name', sortOrder: 'desc' })
    expect(result.items[0].name).toBe('Zeta')
  })

  // ── getById ───────────────────────────────────────────────────────────────

  it('GH-X2: getById returns null for an unknown id', async () => {
    expect(await adapter.getById('00000000-0000-0000-0000-000000000000')).toBeNull()
  })

  it('getById returns the cert for a known id', async () => {
    const cert = await adapter.create({ name: 'Test' })
    expect((await adapter.getById(cert.id))?.name).toBe('Test')
  })

  // ── create ────────────────────────────────────────────────────────────────

  it('create defaults status to planned', async () => {
    const cert = await adapter.create({ name: 'Default Status' })
    expect(cert.status).toBe('planned')
    expect(cert.id).toBeTruthy()
    expect(cert.createdAt).toBeTruthy()
  })

  it('create stores optional fields', async () => {
    const cert = await adapter.create({
      name: 'Full',
      status: 'in_progress',
      categoryPath: 'Cloud/AWS',
      studyStartDate: '2026-01-01',
      expectedExamDate: '2026-06-01',
      notes: 'important',
      evidenceUrl: 'https://example.com/badge',
    })
    expect(cert.status).toBe('in_progress')
    expect(cert.category?.normalizedPath).toBe('cloud/aws')
    expect(cert.studyStartDate).toBe('2026-01-01')
    expect(cert.notes).toBe('important')
  })

  // ── update ────────────────────────────────────────────────────────────────

  it('update merges fields — name only', async () => {
    const cert = await adapter.create({ name: 'Old Name' })
    const updated = await adapter.update(cert.id, { name: 'New Name' })
    expect(updated.name).toBe('New Name')
    expect(updated.status).toBe('planned')
  })

  it('update clears optional field with null', async () => {
    const cert = await adapter.create({ name: 'X', notes: 'some notes' })
    const updated = await adapter.update(cert.id, { notes: null })
    expect(updated.notes).toBeUndefined()
  })

  it('update bumps updatedAt', async () => {
    const cert = await adapter.create({ name: 'Y' })
    await new Promise(r => setTimeout(r, 5))
    const updated = await adapter.update(cert.id, { name: 'Y2' })
    expect(updated.updatedAt >= cert.updatedAt).toBe(true)
  })

  it('update throws for unknown id', async () => {
    await expect(adapter.update('unknown', { name: 'X' })).rejects.toThrow()
  })

  // ── remove ────────────────────────────────────────────────────────────────

  it('remove hides cert from list and getById', async () => {
    const cert = await adapter.create({ name: 'Gone' })
    await adapter.remove(cert.id)
    expect(await adapter.getById(cert.id)).toBeNull()
    const page = await adapter.list()
    expect(page.items.find(c => c.id === cert.id)).toBeUndefined()
  })

  it('remove throws for unknown id', async () => {
    await expect(adapter.remove('unknown')).rejects.toThrow()
  })

  // ── listCategories ────────────────────────────────────────────────────────

  it('listCategories returns counts by normalizedPath', async () => {
    await adapter.create({ name: 'A', categoryPath: 'Cloud/AWS' })
    await adapter.create({ name: 'B', categoryPath: 'Cloud/AWS' })
    await adapter.create({ name: 'C', categoryPath: 'DevOps' })
    const cats = await adapter.listCategories()
    const aws = cats.find(c => c.normalizedPath === 'cloud/aws')
    expect(aws?.count).toBe(2)
    const devops = cats.find(c => c.normalizedPath === 'devops')
    expect(devops?.count).toBe(1)
  })

  it('listCategories excludes removed certifications', async () => {
    const cert = await adapter.create({ name: 'Gone', categoryPath: 'Temp' })
    await adapter.remove(cert.id)
    const cats = await adapter.listCategories()
    expect(cats.find(c => c.normalizedPath === 'temp')).toBeUndefined()
  })
})
