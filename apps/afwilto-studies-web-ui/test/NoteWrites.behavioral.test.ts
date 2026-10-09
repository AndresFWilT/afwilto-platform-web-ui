import { describe, it, expect } from 'vitest'
import type { IStudiesService } from '../src/application/ports'
import { StudiesConflictError, StudiesNotFoundError, StudiesValidationError } from '../src/application/errors'
import { InMemoryStudiesAdapter, type StudiesSeed } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesHttpAdapter } from '../src/infrastructure/adapters/http/StudiesHttpAdapter'
import { contractApi } from './support/contractApi'
import { IDS, librarySeed } from './fixtures'

// S09b-1: note writes, judged identically for both adapters; messages and
// check order are studies-mngr's (usecase/notes.go, handlers_notes.go, domain).
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

async function expectViolation(p: Promise<unknown>, field: string, rule: string, message: string) {
  const e = await rejection(p)
  expect(e).toBeInstanceOf(StudiesValidationError)
  expect((e as StudiesValidationError).violations).toEqual([{ field, rule, message }])
}

const TAG_MESSAGE = 'tag must be lowercase kebab-case, 1–40 characters'
const base = { title: 'Lambda', kindId: IDS.summary, content: '', tags: [] as string[], slabLinks: [] as Array<{ label: string; path: string }> }

describe.each(adapters)('%s note writes (S09b-1)', (_name, make) => {
  const service = () => make(librarySeed())

  describe('createNote', () => {
    it('creates with a trimmed title, normalized sorted tags and trimmed link labels', async () => {
      const svc = service()
      const note = await svc.createNote(IDS.ccp, {
        title: '  Lambda ',
        kindId: IDS.cheat,
        content: '# Lambda\n\n$$x^2$$',
        tags: [' Cloud Security ', 'IAM', 'iam'],
        slabLinks: [{ label: ' Lab ', path: '/slab/ud/operative-systems' }],
      })
      expect(note).toMatchObject({
        subjectId: IDS.ccp,
        title: 'Lambda',
        kind: { id: IDS.cheat, name: 'Cheat sheet' },
        content: '# Lambda\n\n$$x^2$$',
        tags: ['cloud-security', 'iam'],
        slabLinks: [{ label: 'Lab', path: '/slab/ud/operative-systems' }],
        version: 1,
      })
      expect(await svc.getNote(note.id)).toMatchObject({ title: 'Lambda', version: 1 })
      expect((await svc.getSubject(IDS.ccp))!.noteCount).toBe(4)
    })

    it.each([
      [{ title: '' }, 'title', 'required', 'title must not be empty'],
      [{ title: 'x'.repeat(201) }, 'title', 'max_length', 'title must be at most 200 characters'],
      [{ title: 'tab\there' }, 'title', 'format', 'title must not contain control characters'],
      [{ content: 'nul\u0000' }, 'content', 'format', 'content must not contain NUL characters'],
      [{ tags: ['ok', 'bad_tag!'] }, 'tags[1]', 'format', TAG_MESSAGE],
      [{ tags: ['   '] }, 'tags[0]', 'required', TAG_MESSAGE],
      [{ tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }, 'tags', 'max_items', 'a note has at most 10 distinct tags'],
      [{ slabLinks: Array.from({ length: 11 }, () => ({ label: 'l', path: '/slab/a' })) }, 'slabLinks', 'max_items', 'a note has at most 10 slab links'],
      [{ slabLinks: [{ label: ' ', path: '/slab/a' }] }, 'slabLinks[0].label', 'required', 'label must not be empty'],
      [{ slabLinks: [{ label: 'ok', path: '/finance' }] }, 'slabLinks[0].path', 'format', 'path must look like /slab/<segment>[/<segment>…] in lowercase kebab-case'],
      [{ kindId: 'nope' }, 'kindId', 'format', 'kindId must be a UUID'],
      [{ content: 'a'.repeat(200_001) }, 'content', 'max_length', 'content must be at most 200000 characters'],
      [{ slabLinks: [{ label: 'bell\u0007', path: '/slab/a' }] }, 'slabLinks[0].label', 'format', 'label must not contain control characters'],
      [{ slabLinks: [{ label: 'x'.repeat(81), path: '/slab/a' }] }, 'slabLinks[0].label', 'max_length', 'label must be at most 80 characters'],
    ])('rejects %j on %s (%s)', async (override, field, rule, message) => {
      await expectViolation(service().createNote(IDS.ccp, { ...base, ...override }), field, rule, message)
    })

    it('eleven entries that normalize to ten distinct tags are fine', async () => {
      const tags = [...Array.from({ length: 10 }, (_, i) => `t${i}`), 'T0']
      expect((await service().createNote(IDS.ccp, { ...base, tags })).tags).toHaveLength(10)
    })

    it('validates the fields before resolving the subject; an unknown subject is not found', async () => {
      await expectViolation(service().createNote(IDS.missing, { ...base, title: '' }), 'title', 'required', 'title must not be empty')
      expect(await rejection(service().createNote(IDS.missing, base))).toBeInstanceOf(StudiesNotFoundError)
    })

    it('an unknown subject wins over an unknown kind (the subject is checked first)', async () => {
      expect(await rejection(service().createNote(IDS.missing, { ...base, kindId: IDS.missing }))).toBeInstanceOf(StudiesNotFoundError)
    })

    it('lowercases like Go: "İAM" is the tag iam', async () => {
      expect((await service().createNote(IDS.ccp, { ...base, tags: ['İAM'] })).tags).toEqual(['iam'])
    })

    it('rejects an unknown kind', async () => {
      await expectViolation(service().createNote(IDS.ccp, { ...base, kindId: IDS.missing }), 'kindId', 'not_found', 'note kind does not exist')
    })

    it('rejects a duplicate title in the same subject only (BR-NOTE1)', async () => {
      const svc = service()
      const e = await rejection(svc.createNote(IDS.ccp, { ...base, title: 'COMPUTE' }))
      expect(e).toBeInstanceOf(StudiesConflictError)
      expect(e).toMatchObject({ field: 'title', rule: 'duplicate_name', message: 'a note with this title already exists in the subject' })
      await expect(svc.createNote(IDS.azure, { ...base, title: 'Compute' })).resolves.toMatchObject({ subjectId: IDS.azure })
    })
  })

  describe('updateNote', () => {
    it('bumps the version and updatedAt, and leaves untouched fields alone (BR-NOTE4)', async () => {
      const svc = service()
      const updated = await svc.updateNote(IDS.compute, { version: 3, title: 'Compute 2' })
      expect(updated).toMatchObject({ title: 'Compute 2', version: 4, tags: ['ec2', 'iam'], kind: { id: IDS.summary } })
      expect(updated.content).toBe('<script>alert(1)</script>\nEC2 **instances**')
      expect(Date.parse(updated.updatedAt)).toBeGreaterThan(Date.parse('2026-01-03T12:00:00.000Z'))
    })

    it('a stale version is a conflict and changes nothing (BR-NOTE3)', async () => {
      const svc = service()
      const e = await rejection(svc.updateNote(IDS.compute, { version: 2, content: 'lost?' }))
      expect(e).toBeInstanceOf(StudiesConflictError)
      expect(e).toMatchObject({ field: 'version', rule: 'stale_version', message: 'the note was changed since you read it; reload and re-apply your edit' })
      expect((await svc.getNote(IDS.compute))!.content).toBe('<script>alert(1)</script>\nEC2 **instances**')
    })

    it('a version below 1 or an empty patch is a 422, before the note is looked up', async () => {
      await expectViolation(service().updateNote(IDS.missing, { version: 0, title: 'X' }), 'version', 'min', 'version must be at least 1')
      await expectViolation(
        service().updateNote(IDS.missing, { version: 1 }),
        'body',
        'required',
        'at least one of title, kindId, subjectId, content, tags or slabLinks must be provided'
      )
    })

    it('an empty patch is reported before a stale version', async () => {
      await expectViolation(
        service().updateNote(IDS.compute, { version: 1 }),
        'body',
        'required',
        'at least one of title, kindId, subjectId, content, tags or slabLinks must be provided'
      )
    })

    it('checks fields in the backend order: title before kind', async () => {
      await expectViolation(service().updateNote(IDS.storage, { version: 1, title: '', kindId: IDS.missing }), 'title', 'required', 'title must not be empty')
    })

    it('rejects a malformed subjectId before anything else', async () => {
      await expectViolation(service().updateNote(IDS.missing, { version: 1, subjectId: 'nope' }), 'subjectId', 'format', 'subjectId must be a UUID')
    })

    it('an unknown note is not found', async () => {
      expect(await rejection(service().updateNote(IDS.missing, { version: 1, title: 'X' }))).toBeInstanceOf(StudiesNotFoundError)
    })

    it('replaces tags and slab links as whole sets', async () => {
      const updated = await service().updateNote(IDS.compute, {
        version: 3,
        tags: ['S3', 'iam'],
        slabLinks: [{ label: 'MLFQ', path: '/slab/ud/operative-systems/mlfq-scheduler' }],
      })
      expect(updated.tags).toEqual(['iam', 's3'])
      expect(updated.slabLinks).toEqual([{ label: 'MLFQ', path: '/slab/ud/operative-systems/mlfq-scheduler' }])
    })

    it('moves to another subject (FR-3, D-2); a title clash there is a conflict', async () => {
      const svc = service()
      expect(await svc.updateNote(IDS.storage, { version: 1, subjectId: IDS.azure })).toMatchObject({ subjectId: IDS.azure })
      expect((await svc.listSubjectNotes(IDS.azure))!.map((n) => n.title)).toEqual(['Entra ID', 'Storage'])
      await svc.createNote(IDS.azure, { ...base, title: 'Networking' })
      const e = await rejection(svc.updateNote(IDS.networking, { version: 1, subjectId: IDS.azure }))
      expect(e).toMatchObject({ field: 'title', rule: 'duplicate_name' })
    })

    it('rejects an unknown subject or kind as a reference', async () => {
      await expectViolation(service().updateNote(IDS.storage, { version: 1, subjectId: IDS.missing }), 'subjectId', 'not_found', 'subject does not exist')
      await expectViolation(service().updateNote(IDS.storage, { version: 1, kindId: IDS.missing }), 'kindId', 'not_found', 'note kind does not exist')
    })

    it('renaming to its own title in another case is fine', async () => {
      expect(await service().updateNote(IDS.storage, { version: 1, title: 'STORAGE' })).toMatchObject({ title: 'STORAGE', version: 2 })
    })
  })

  describe('deleteNote', () => {
    it('deletes logically: gone from reads, counts and tag views; the title is free (AC-B19)', async () => {
      const svc = service()
      await expect(svc.deleteNote(IDS.compute)).resolves.toBeUndefined()
      expect(await svc.getNote(IDS.compute)).toBeNull()
      expect((await svc.listSubjectNotes(IDS.ccp))!.map((n) => n.title)).toEqual(['Networking', 'Storage'])
      expect((await svc.listNotesByTag('iam')).map((n) => n.title)).toEqual(['Entra ID'])
      expect((await svc.listKinds()).find((k) => k.id === IDS.summary)!.noteCount).toBe(2)
      await expect(svc.createNote(IDS.ccp, { ...base, title: 'compute' })).resolves.toMatchObject({ title: 'compute' })
      expect(await rejection(svc.deleteNote(IDS.compute))).toBeInstanceOf(StudiesNotFoundError)
    })
  })
})
