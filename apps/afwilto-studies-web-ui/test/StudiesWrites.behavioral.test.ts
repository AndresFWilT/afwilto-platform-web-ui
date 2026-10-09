import { describe, it, expect } from 'vitest'
import type { IStudiesService } from '../src/application/ports'
import { StudiesConflictError, StudiesNotFoundError, StudiesValidationError } from '../src/application/errors'
import { InMemoryStudiesAdapter, type StudiesSeed } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesHttpAdapter } from '../src/infrastructure/adapters/http/StudiesHttpAdapter'
import { contractApi } from './support/contractApi'
import { IDS, librarySeed } from './fixtures'

// S09a-1: the write half of the port, judged identically for both adapters.
// Messages are studies-mngr's own, so pages can show them verbatim.
const adapters: Array<[string, (seed: StudiesSeed) => IStudiesService]> = [
  ['InMemoryStudiesAdapter', (seed) => new InMemoryStudiesAdapter(seed)],
  ['StudiesHttpAdapter', (seed) => new StudiesHttpAdapter(contractApi(seed))],
]

async function rejection(p: Promise<unknown>): Promise<unknown> {
  try {
    await p
  } catch (e) {
    return e
  }
  throw new Error('expected a rejection')
}

async function expectViolation(p: Promise<unknown>, field: string, rule: string, message?: string) {
  const e = await rejection(p)
  expect(e).toBeInstanceOf(StudiesValidationError)
  const violation = (e as StudiesValidationError).violations.find((v) => v.field === field)
  expect(violation, `no violation on ${field}`).toBeTruthy()
  expect(violation!.rule).toBe(rule)
  if (message) expect(violation!.message).toBe(message)
}

async function expectConflict(p: Promise<unknown>, field: string, rule: string, message: string) {
  const e = await rejection(p)
  expect(e).toBeInstanceOf(StudiesConflictError)
  expect(e).toMatchObject({ field, rule, message })
}

const MISSING = IDS.missing

describe.each(adapters)('%s writes (S09a-1)', (_name, make) => {
  const service = () => make(librarySeed())
  const byName = async (svc: IStudiesService, name: string) => (await svc.listCategories()).find((c) => c.name === name)

  describe('categories', () => {
    it('creates a root, trimming the name and uppercasing the color', async () => {
      const svc = service()
      const created = await svc.createCategory({ name: '  Physics ', color: '#ff9900', parentId: null })
      expect(created).toMatchObject({ name: 'Physics', color: '#FF9900', parentId: null, path: 'Physics', depth: 1, subjectCount: 0 })
      expect(await byName(svc, 'Physics')).toMatchObject({ id: created.id })
    })

    it('creates a child with the derived path and depth', async () => {
      const created = await service().createCategory({ name: 'Lambda', color: '#22D3EE', parentId: IDS.aws })
      expect(created).toMatchObject({ parentId: IDS.aws, path: 'TI / Cloud / AWS / Lambda', depth: 4 })
    })

    it('rejects a duplicate sibling name, case-insensitive, at any level (BR-CAT1)', async () => {
      const svc = service()
      await expectConflict(svc.createCategory({ name: 'cloud', color: '#22D3EE', parentId: IDS.ti }), 'name', 'duplicate_name', 'a sibling category with this name already exists')
      await expectConflict(svc.createCategory({ name: 'ti', color: '#22D3EE', parentId: null }), 'name', 'duplicate_name', 'a sibling category with this name already exists')
      await expect(svc.createCategory({ name: 'Cloud', color: '#22D3EE', parentId: IDS.math })).resolves.toMatchObject({ path: 'Math / Cloud' })
    })

    it.each([
      ['', 'name', 'required', 'name must not be empty'],
      ['   ', 'name', 'required', 'name must not be empty'],
      ['x'.repeat(61), 'name', 'max_length', 'name must be at most 60 characters'],
      ['bad\u0007name', 'name', 'format', 'name must not contain control characters'],
    ])('rejects name %j (%s %s)', async (name, field, rule, message) => {
      await expectViolation(service().createCategory({ name, color: '#22D3EE', parentId: null }), field, rule, message)
    })

    it('rejects a malformed color', async () => {
      await expectViolation(service().createCategory({ name: 'X', color: 'red', parentId: null }), 'color', 'format', 'color must be a 6-digit hex value like #22D3EE')
    })

    it('rejects an unknown parent (BR-DEL2)', async () => {
      await expectViolation(service().createCategory({ name: 'X', color: '#22D3EE', parentId: MISSING }), 'parentId', 'not_found', 'parent category does not exist')
    })

    it('rejects a sixth level (BR-CAT3)', async () => {
      const svc = service()
      const d4 = await svc.createCategory({ name: 'D4', color: '#22D3EE', parentId: IDS.aws })
      const d5 = await svc.createCategory({ name: 'D5', color: '#22D3EE', parentId: d4.id })
      await expectViolation(svc.createCategory({ name: 'D6', color: '#22D3EE', parentId: d5.id }), 'parentId', 'max_depth', 'the category tree is limited to 5 levels')
    })

    it('renames without touching descendants, whose paths follow (AC-B5)', async () => {
      const svc = service()
      const updated = await svc.updateCategory(IDS.cloud, { name: 'Cloud Computing' })
      expect(updated).toMatchObject({ name: 'Cloud Computing', parentId: IDS.ti })
      expect((await byName(svc, 'AWS'))!.path).toBe('TI / Cloud Computing / AWS')
    })

    it('parentId null moves to the root; an absent parentId leaves the category in place', async () => {
      const svc = service()
      expect(await svc.updateCategory(IDS.aws, { color: '#000000' })).toMatchObject({ parentId: IDS.cloud, color: '#000000' })
      expect(await svc.updateCategory(IDS.aws, { parentId: null })).toMatchObject({ parentId: null, path: 'AWS', depth: 1 })
    })

    it('rejects moving under itself or a descendant (BR-CAT4)', async () => {
      const svc = service()
      await expectViolation(svc.updateCategory(IDS.ti, { parentId: IDS.ti }), 'parentId', 'cycle', 'a category cannot be placed under itself or one of its descendants')
      await expectViolation(svc.updateCategory(IDS.ti, { parentId: IDS.aws }), 'parentId', 'cycle')
    })

    it('rejects a move that would make the subtree deeper than 5 (BR-CAT3)', async () => {
      const svc = service()
      const d4 = await svc.createCategory({ name: 'D4', color: '#22D3EE', parentId: IDS.aws })
      // Cloud's subtree (Cloud > AWS > D4) has height 3; under AWS-level depth 3 it would reach 6.
      const other = await svc.createCategory({ name: 'Other', color: '#22D3EE', parentId: IDS.math })
      const deeper = await svc.createCategory({ name: 'Deeper', color: '#22D3EE', parentId: other.id })
      expect(d4.depth).toBe(4)
      await expectViolation(svc.updateCategory(IDS.cloud, { parentId: deeper.id }), 'parentId', 'max_depth')
    })

    it('rejects a move that collides with a sibling name', async () => {
      const svc = service()
      await svc.createCategory({ name: 'aws', color: '#22D3EE', parentId: null })
      await expectConflict(svc.updateCategory(IDS.aws, { parentId: null }), 'name', 'duplicate_name', 'a sibling category with this name already exists')
    })

    it('an empty patch is a 422 on body, checked before the id exists (handler, minProperties 1)', async () => {
      const svc = service()
      const message = 'at least one of name, color or parentId must be provided'
      await expectViolation(svc.updateCategory(IDS.ti, {}), 'body', 'required', message)
      await expectViolation(svc.updateCategory(MISSING, {}), 'body', 'required', message)
    })

    it('reports one violation at a time, name first (the backend stops at the first failing check)', async () => {
      const e = (await rejection(service().createCategory({ name: '', color: 'red', parentId: null }))) as StudiesValidationError
      expect(e.violations).toEqual([{ field: 'name', rule: 'required', message: 'name must not be empty' }])
    })

    it('a malformed parentId is a format error, checked before the name', async () => {
      await expectViolation(service().createCategory({ name: '', color: '#22D3EE', parentId: 'not-a-uuid' }), 'parentId', 'format', 'parentId must be a UUID')
      await expectViolation(service().updateCategory(IDS.ti, { parentId: 'nope' }), 'parentId', 'format', 'parentId must be a UUID')
    })

    it('a legal move that lands exactly on depth 5 succeeds', async () => {
      const svc = service()
      const d4 = await svc.createCategory({ name: 'D4', color: '#22D3EE', parentId: IDS.aws })
      const leaf = await svc.createCategory({ name: 'Leaf', color: '#22D3EE', parentId: IDS.math })
      expect(await svc.updateCategory(leaf.id, { parentId: d4.id })).toMatchObject({ depth: 5, path: 'TI / Cloud / AWS / D4 / Leaf' })
    })

    it('accepts ids in any case and trims like Go strings.TrimSpace', async () => {
      const seed = librarySeed()
      const hexId = 'abcdef01-0000-7000-8000-00000000abcd' // letters, so upper-casing really changes it
      seed.categories.push({ id: hexId, parentId: null, name: 'Hex', color: '#22D3EE' })
      const svc = make(seed)
      expect(await svc.updateCategory(hexId.toUpperCase(), { name: 'Hexa' })).toMatchObject({ id: hexId, name: 'Hexa' })
      await expect(svc.deleteCategory(hexId.toUpperCase())).resolves.toBeUndefined()
      expect(await svc.updateCategory(IDS.cloud, { name: 'Cloud\u0085' })).toMatchObject({ id: IDS.cloud, name: 'Cloud' })
      expect(await svc.createCategory({ name: '\uFEFFBOM', color: '#22D3EE', parentId: null })).toMatchObject({ name: '\uFEFFBOM' })
    })

    it('updating or deleting an unknown category is not found', async () => {
      const svc = service()
      expect(await rejection(svc.updateCategory(MISSING, { name: 'X' }))).toBeInstanceOf(StudiesNotFoundError)
      expect(await rejection(svc.deleteCategory(MISSING))).toBeInstanceOf(StudiesNotFoundError)
    })

    it('blocks deleting a category with alive children or subjects (BR-DEL1)', async () => {
      const svc = service()
      // The use case's messages, children checked before subjects (usecase/categories.go).
      await expectConflict(svc.deleteCategory(IDS.ti), 'id', 'in_use', 'category has 1 subcategories; move or delete them first')
      await expectConflict(svc.deleteCategory(IDS.math), 'id', 'in_use', 'category has 1 subjects; move or delete them first')
      await expectConflict(svc.deleteCategory(IDS.cloud), 'id', 'in_use', 'category has 1 subcategories; move or delete them first')
    })

    it('deletes logically: gone from the list and the name is free again (FR-0)', async () => {
      const svc = service()
      const empty = await svc.createCategory({ name: 'Temp', color: '#22D3EE', parentId: null })
      await expect(svc.deleteCategory(empty.id)).resolves.toBeUndefined()
      expect(await byName(svc, 'Temp')).toBeUndefined()
      expect(await rejection(svc.deleteCategory(empty.id))).toBeInstanceOf(StudiesNotFoundError)
      await expect(svc.createCategory({ name: 'temp', color: '#22D3EE', parentId: null })).resolves.toMatchObject({ name: 'temp' })
    })
  })

  describe('deleted rows never count (FR-0)', () => {
    it('kind and subject note counts ignore deleted notes', async () => {
      const seed = librarySeed()
      seed.notes.push({ ...seed.notes[0], id: '00000000-0000-7000-8000-0000000000dd', title: 'Gone', deletedAt: '2026-01-05T12:00:00.000Z' })
      const svc = make(seed)
      expect((await svc.listKinds()).find((k) => k.id === IDS.cheat)!.noteCount).toBe(1)
      expect((await svc.getSubject(IDS.ccp))!.noteCount).toBe(3)
    })
  })

  describe('note kinds', () => {
    it('a deleted kind frees its name', async () => {
      const svc = service()
      const lab = await svc.createKind('Lab report')
      await svc.deleteKind(lab.id)
      await expect(svc.createKind('lab REPORT')).resolves.toMatchObject({ name: 'lab REPORT' })
    })

    it('lists alive kinds alphabetically with their alive note counts', async () => {
      expect(await service().listKinds()).toEqual([
        { id: IDS.cheat, name: 'Cheat sheet', noteCount: 1 },
        { id: IDS.summary, name: 'Summary', noteCount: 3 },
      ])
    })

    it('creates, rejects a case-insensitive duplicate, and renames (BR-KIND1)', async () => {
      const svc = service()
      const lab = await svc.createKind('  Lab report ')
      expect(lab).toMatchObject({ name: 'Lab report', noteCount: 0 })
      await expectConflict(svc.createKind('summary'), 'name', 'duplicate_name', 'a note kind with this name already exists')
      expect(await svc.renameKind(lab.id, 'Lab notes')).toMatchObject({ id: lab.id, name: 'Lab notes' })
      await expectConflict(svc.renameKind(lab.id, 'SUMMARY'), 'name', 'duplicate_name', 'a note kind with this name already exists')
      expect(await svc.renameKind(IDS.summary, 'summary')).toMatchObject({ name: 'summary' }) // own name, new case
    })

    it.each([
      ['', 'required', 'name must not be empty'],
      ['x'.repeat(41), 'max_length', 'name must be at most 40 characters'],
    ])('rejects kind name %j', async (name, rule, message) => {
      await expectViolation(service().createKind(name), 'name', rule, message)
    })

    it('blocks deleting a kind used by alive notes; deletes an unused one (BR-DEL1, AC-B10)', async () => {
      const svc = service()
      await expectConflict(svc.deleteKind(IDS.summary), 'id', 'in_use', 'note kind is used by 3 notes; change or delete them first')
      const lab = await svc.createKind('Lab report')
      await expect(svc.deleteKind(lab.id)).resolves.toBeUndefined()
      expect((await svc.listKinds()).map((k) => k.name)).toEqual(['Cheat sheet', 'Summary'])
      expect(await rejection(svc.renameKind(lab.id, 'X'))).toBeInstanceOf(StudiesNotFoundError)
    })
  })

  describe('subjects', () => {
    it('creates a subject with its category ref', async () => {
      const svc = service()
      const created = await svc.createSubject({ categoryId: IDS.math, name: ' Linear algebra ', description: null })
      expect(created).toMatchObject({
        name: 'Linear algebra',
        description: null,
        noteCount: 0,
        category: { id: IDS.math, name: 'Math', path: 'Math' },
      })
      expect((await svc.listSubjects()).map((s) => s.name)).toContain('Linear algebra')
    })

    it('rejects a duplicate in the same category only (BR-SUB1)', async () => {
      const svc = service()
      await expectConflict(svc.createSubject({ categoryId: IDS.math, name: 'calculus', description: null }), 'name', 'duplicate_name', 'a subject with this name already exists in the category')
      await expect(svc.createSubject({ categoryId: IDS.ti, name: 'Calculus', description: null })).resolves.toBeTruthy()
    })

    it('rejects an unknown category and an over-long description', async () => {
      const svc = service()
      await expectViolation(svc.createSubject({ categoryId: MISSING, name: 'X', description: null }), 'categoryId', 'not_found', 'category does not exist')
      await expectViolation(svc.createSubject({ categoryId: IDS.math, name: 'X', description: 'd'.repeat(2001) }), 'description', 'max_length', 'description must be at most 2000 characters')
    })

    it('an empty patch is a 422 on body, even for an unknown id', async () => {
      const message = 'at least one of categoryId, name or description must be provided'
      await expectViolation(service().updateSubject(IDS.ccp, {}), 'body', 'required', message)
      await expectViolation(service().updateSubject(MISSING, {}), 'body', 'required', message)
    })

    it('checks categoryId format first, then the name, one violation at a time', async () => {
      const svc = service()
      await expectViolation(svc.createSubject({ categoryId: '', name: '', description: null }), 'categoryId', 'format', 'categoryId must be a UUID')
      const e = (await rejection(svc.createSubject({ categoryId: IDS.math, name: '', description: 'd'.repeat(2001) }))) as StudiesValidationError
      expect(e.violations).toEqual([{ field: 'name', rule: 'required', message: 'name must not be empty' }])
    })

    it('a deleted subject frees its name in the category', async () => {
      const svc = service()
      await svc.deleteSubject(IDS.emptySubject)
      await expect(svc.createSubject({ categoryId: IDS.math, name: 'calculus', description: null })).resolves.toMatchObject({ name: 'calculus' })
    })

    it('updates name and clears the description with null', async () => {
      const updated = await service().updateSubject(IDS.ccp, { name: 'AWS CCP', description: null })
      expect(updated).toMatchObject({ name: 'AWS CCP', description: null, noteCount: 3 })
    })

    it('moves to another category; a name clash there is a conflict', async () => {
      const svc = service()
      expect(await svc.updateSubject(IDS.azure, { categoryId: IDS.math })).toMatchObject({ category: { id: IDS.math, path: 'Math' } })
      await svc.createSubject({ categoryId: IDS.ti, name: 'Calculus', description: null })
      await expectConflict(svc.updateSubject(IDS.emptySubject, { categoryId: IDS.ti }), 'name', 'duplicate_name', 'a subject with this name already exists in the category')
    })

    it('blocks deleting a subject with notes; deletes an empty one logically', async () => {
      const svc = service()
      await expectConflict(svc.deleteSubject(IDS.ccp), 'id', 'in_use', 'subject has 3 notes; move or delete them first')
      await expect(svc.deleteSubject(IDS.emptySubject)).resolves.toBeUndefined()
      expect(await svc.getSubject(IDS.emptySubject)).toBeNull()
      expect((await byName(svc, 'Math'))!.subjectCount).toBe(0)
      expect(await rejection(svc.updateSubject(IDS.emptySubject, { name: 'X' }))).toBeInstanceOf(StudiesNotFoundError)
    })
  })
})
