import { describe, it, expect } from 'vitest'
import type { IStudiesService } from '../src/application/ports'
import { InMemoryStudiesAdapter, type StudiesSeed } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesHttpAdapter } from '../src/infrastructure/adapters/http/StudiesHttpAdapter'
import { contractApi } from './support/contractApi'
import { AC_B16_ORDERS, IDS, TIE, librarySeed, tieSeed } from './fixtures'

// One behavioral contract, two adapters (S07-11): Liskov substitution made
// executable. The HTTP adapter talks to a contract-shaped fake API.
const adapters: Array<[string, (seed: StudiesSeed) => IStudiesService]> = [
  ['InMemoryStudiesAdapter', (seed) => new InMemoryStudiesAdapter(seed)],
  ['StudiesHttpAdapter', (seed) => new StudiesHttpAdapter(contractApi(seed))],
]

describe.each(adapters)('%s behavioral contract (S07-11)', (_name, make) => {
  const service = () => make(librarySeed())
  const empty = () => make({ categories: [], kinds: [], subjects: [], notes: [] })

  describe('categories', () => {
    it('lists every category with path, depth and direct subjectCount', async () => {
      const cats = await service().listCategories()
      const byName = Object.fromEntries(cats.map((c) => [c.name, c]))
      expect(cats).toHaveLength(4)
      expect(byName['AWS']).toEqual({
        id: IDS.aws,
        parentId: IDS.cloud,
        name: 'AWS',
        color: '#FF9900',
        path: 'TI / Cloud / AWS',
        depth: 3,
        subjectCount: 1,
      })
      expect(byName['TI']).toMatchObject({ parentId: null, path: 'TI', depth: 1, subjectCount: 0 })
      expect(byName['Cloud'].subjectCount).toBe(1)
    })

    it('orders by the backend path key, where the separator sorts below any printable character', async () => {
      const cats = await make(tieSeed()).listCategories()
      expect(cats.map((c) => c.path)).toEqual(['TI', 'TI / Cloud', 'TI !'])
    })

    it('an empty store lists no categories', async () => {
      expect(await empty().listCategories()).toEqual([])
    })
  })

  describe('subjects', () => {
    it('lists every subject with its category ref and alive noteCount', async () => {
      const subjects = await service().listSubjects()
      expect(subjects.map((s) => s.name).sort()).toEqual(['AWS Certified Cloud Practitioner', 'Azure', 'Calculus'])
      const ccp = subjects.find((s) => s.id === IDS.ccp)!
      expect(ccp).toMatchObject({
        categoryId: IDS.aws,
        category: { id: IDS.aws, name: 'AWS', color: '#FF9900', path: 'TI / Cloud / AWS' },
        description: 'Foundational AWS certification.',
        noteCount: 3,
      })
    })

    it('gets one subject by id', async () => {
      const s = await service().getSubject(IDS.azure)
      expect(s).toMatchObject({ id: IDS.azure, name: 'Azure', description: null, noteCount: 1 })
    })

    it('returns null for an unknown subject', async () => {
      expect(await service().getSubject(IDS.missing)).toBeNull()
    })
  })

  describe('subject notes', () => {
    it('lists summaries without content or slabLinks, default A–Z', async () => {
      const notes = (await service().listSubjectNotes(IDS.ccp))!
      expect(notes.map((n) => n.title)).toEqual(['Compute', 'Networking', 'Storage'])
      for (const n of notes) {
        expect(n).not.toHaveProperty('content')
        expect(n).not.toHaveProperty('slabLinks')
      }
      expect(notes[0]).toMatchObject({
        id: IDS.compute,
        subjectId: IDS.ccp,
        kind: { id: IDS.summary, name: 'Summary' },
        tags: ['ec2', 'iam'],
        version: 3,
      })
    })

    it.each(AC_B16_ORDERS)('sort "$label" orders $titles', async ({ sort, order, titles }) => {
      const notes = (await service().listSubjectNotes(IDS.ccp, { field: sort, order }))!
      expect(notes.map((n) => n.title)).toEqual(titles)
    })

    it('equal timestamps fall back to title, case-insensitive', async () => {
      const notes = (await make(tieSeed()).listSubjectNotes(TIE.s1, { field: 'updatedAt', order: 'desc' }))!
      expect(notes.map((n) => n.title)).toEqual(['apple', 'Banana'])
    })

    it('titles equal up to case break by id ascending, in both directions', async () => {
      const svc = make(tieSeed())
      const asc = await svc.listNotesByTag('dup', { field: 'title', order: 'asc' })
      expect(asc.map((n) => n.id)).toEqual([TIE.appleUpper, TIE.appleLower, TIE.banana])
      const desc = await svc.listNotesByTag('dup', { field: 'title', order: 'desc' })
      expect(desc.map((n) => n.id)).toEqual([TIE.banana, TIE.appleUpper, TIE.appleLower])
    })

    it('a subject without notes gives an empty list', async () => {
      expect(await service().listSubjectNotes(IDS.emptySubject)).toEqual([])
    })

    it('returns null for an unknown subject', async () => {
      expect(await service().listSubjectNotes(IDS.missing)).toBeNull()
    })
  })

  describe('notes', () => {
    it('gets a full note with content verbatim and slab links in order', async () => {
      const note = await service().getNote(IDS.compute)
      expect(note).toMatchObject({
        id: IDS.compute,
        title: 'Compute',
        content: '<script>alert(1)</script>\nEC2 **instances**',
        slabLinks: [{ label: 'Round robin lab', path: '/slab/ud/operative-systems/round-robin' }],
        tags: ['ec2', 'iam'],
      })
    })

    it('returns null for an unknown note', async () => {
      expect(await service().getNote(IDS.missing)).toBeNull()
    })
  })

  describe('tag view', () => {
    it('lists notes across subjects, each with subject and category', async () => {
      const notes = await service().listNotesByTag('iam')
      expect(notes.map((n) => n.title)).toEqual(['Compute', 'Entra ID'])
      expect(notes[0]).toMatchObject({
        subject: { id: IDS.ccp, name: 'AWS Certified Cloud Practitioner' },
        category: { id: IDS.aws, name: 'AWS', color: '#FF9900', path: 'TI / Cloud / AWS' },
      })
      expect(notes[1]).toMatchObject({
        subject: { id: IDS.azure, name: 'Azure' },
        category: { id: IDS.cloud, path: 'TI / Cloud' },
      })
      expect(notes[0]).not.toHaveProperty('content')
    })

    it('normalizes the raw tag like the backend (" IAM " finds iam)', async () => {
      expect(await service().listNotesByTag(' IAM ')).toHaveLength(2)
    })

    it('turns inner whitespace runs into one dash (" Cloud   Security " finds cloud-security)', async () => {
      const notes = await service().listNotesByTag(' Cloud   Security ')
      expect(notes.map((n) => n.title)).toEqual(['Entra ID'])
    })

    it('honors the sort', async () => {
      const notes = await service().listNotesByTag('iam', { field: 'title', order: 'desc' })
      expect(notes.map((n) => n.title)).toEqual(['Entra ID', 'Compute'])
    })

    it('an unknown tag gives an empty list', async () => {
      expect(await service().listNotesByTag('unknown')).toEqual([])
    })

    it('an invalid tag is rejected with the API message', async () => {
      await expect(service().listNotesByTag('bad_tag!')).rejects.toThrow(
        'tag must be lowercase kebab-case, 1–40 characters'
      )
    })
  })
})
