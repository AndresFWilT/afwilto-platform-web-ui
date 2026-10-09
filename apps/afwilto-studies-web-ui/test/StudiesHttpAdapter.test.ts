import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { StudiesHttpAdapter } from '../src/infrastructure/adapters/http/StudiesHttpAdapter'
import { StudiesConflictError, StudiesNotFoundError, StudiesValidationError } from '../src/application/errors'

function makeHttpClient(): IHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    postMultipart: vi.fn(),
  }
}

const EMPTY_LIST = { data: [], meta: { totalItems: 0 } }

describe('StudiesHttpAdapter (S07-12)', () => {
  let http: IHttpClient
  let adapter: StudiesHttpAdapter

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new StudiesHttpAdapter(http)
  })

  describe('request paths and query strings', () => {
    it.each([
      ['listCategories', () => adapter.listCategories(), '/categories'],
      ['listSubjects', () => adapter.listSubjects(), '/subjects'],
    ])('%s calls GET %s', async (_name, call, path) => {
      vi.mocked(http.get).mockResolvedValue(EMPTY_LIST)
      await call()
      expect(http.get).toHaveBeenCalledWith(path)
    })

    it('getSubject and getNote address the resource by id', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: {} })
      await adapter.getSubject('s-1')
      await adapter.getNote('n-1')
      expect(http.get).toHaveBeenNthCalledWith(1, '/subjects/s-1')
      expect(http.get).toHaveBeenNthCalledWith(2, '/notes/n-1')
    })

    it('omits sort and order for the default sort', async () => {
      vi.mocked(http.get).mockResolvedValue(EMPTY_LIST)
      await adapter.listSubjectNotes('s-1')
      await adapter.listSubjectNotes('s-1', { field: 'title', order: 'asc' })
      expect(http.get).toHaveBeenNthCalledWith(1, '/subjects/s-1/notes')
      expect(http.get).toHaveBeenNthCalledWith(2, '/subjects/s-1/notes')
    })

    it('sends sort and order for any other sort', async () => {
      vi.mocked(http.get).mockResolvedValue(EMPTY_LIST)
      await adapter.listSubjectNotes('s-1', { field: 'updatedAt', order: 'desc' })
      expect(http.get).toHaveBeenCalledWith('/subjects/s-1/notes?sort=updatedAt&order=desc')
    })

    it('URL-encodes the raw tag and appends a non-default sort', async () => {
      vi.mocked(http.get).mockResolvedValue(EMPTY_LIST)
      await adapter.listNotesByTag(' IAM & co ')
      await adapter.listNotesByTag('iam', { field: 'createdAt', order: 'asc' })
      expect(http.get).toHaveBeenNthCalledWith(1, '/notes?tag=+IAM+%26+co+')
      expect(http.get).toHaveBeenNthCalledWith(2, '/notes?tag=iam&sort=createdAt&order=asc')
    })
  })

  describe('envelope unwrap', () => {
    it('returns the data array of a list envelope', async () => {
      const cat = { id: 'c', parentId: null, name: 'TI', color: '#3B82F6', path: 'TI', depth: 1, subjectCount: 0 }
      vi.mocked(http.get).mockResolvedValue({ data: [cat], meta: { totalItems: 1 } })
      expect(await adapter.listCategories()).toEqual([cat])
    })

    it('returns the data object of a single envelope', async () => {
      vi.mocked(http.get).mockResolvedValue({ data: { id: 'n-1', title: 'T' } })
      expect(await adapter.getNote('n-1')).toEqual({ id: 'n-1', title: 'T' })
    })
  })

  describe('error translation', () => {
    it.each([
      ['getSubject', (a: StudiesHttpAdapter) => a.getSubject('x')],
      ['getNote', (a: StudiesHttpAdapter) => a.getNote('x')],
      ['listSubjectNotes', (a: StudiesHttpAdapter) => a.listSubjectNotes('x')],
    ])('%s maps a 404 to null', async (_name, call) => {
      vi.mocked(http.get).mockRejectedValue(
        new HttpError(404, 'Not Found', { error: { code: 'not_found', message: 'resource not found' } })
      )
      expect(await call(adapter)).toBeNull()
    })

    it('a 404 on a list without a null contract is still an error', async () => {
      vi.mocked(http.get).mockRejectedValue(
        new HttpError(404, 'Not Found', { error: { code: 'not_found', message: 'resource not found' } })
      )
      await expect(adapter.listCategories()).rejects.toThrow('resource not found')
    })

    it('joins detail messages with "; "', async () => {
      vi.mocked(http.get).mockRejectedValue(
        new HttpError(422, 'Unprocessable Entity', {
          error: {
            code: 'validation_failed',
            message: 'validation failed',
            details: [
              { field: 'tag', rule: 'format', message: 'tag must be lowercase kebab-case, 1–40 characters' },
              { field: 'sort', rule: 'enum', message: 'sort must be one of title, createdAt, updatedAt' },
            ],
          },
        })
      )
      await expect(adapter.listNotesByTag('bad_tag!')).rejects.toThrow(
        'tag must be lowercase kebab-case, 1–40 characters; sort must be one of title, createdAt, updatedAt'
      )
    })

    it('falls back to error.message without details', async () => {
      vi.mocked(http.get).mockRejectedValue(
        new HttpError(500, 'Internal Server Error', { error: { code: 'internal', message: 'internal server error' } })
      )
      await expect(adapter.listSubjects()).rejects.toThrow('internal server error')
    })

    it('falls back to the bare status without a parsable body', async () => {
      vi.mocked(http.get).mockRejectedValue(new HttpError(502, 'Bad Gateway', null))
      await expect(adapter.listCategories()).rejects.toThrow('Request failed (502)')
    })

    it('never leaks an HttpError past the adapter', async () => {
      vi.mocked(http.get).mockRejectedValue(new HttpError(503, 'Service Unavailable', null))
      const err = await adapter.listCategories().catch((e: unknown) => e)
      expect(err).toBeInstanceOf(Error)
      expect(err).not.toBeInstanceOf(HttpError)
    })

    it('passes non-HTTP failures through as Error', async () => {
      vi.mocked(http.get).mockRejectedValue(new TypeError('Failed to fetch'))
      await expect(adapter.listCategories()).rejects.toThrow('Failed to fetch')
    })
  })
})

describe('StudiesHttpAdapter writes (S09a-2)', () => {
  let http: IHttpClient
  let adapter: StudiesHttpAdapter

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new StudiesHttpAdapter(http)
    vi.mocked(http.post).mockResolvedValue({ data: { id: 'new' } })
    vi.mocked(http.patch).mockResolvedValue({ data: { id: 'x' } })
    vi.mocked(http.delete).mockResolvedValue(undefined)
  })

  it.each([
    ['createCategory', (a: StudiesHttpAdapter) => a.createCategory({ name: 'TI', color: '#22D3EE', parentId: null }), 'post', '/categories', { name: 'TI', color: '#22D3EE', parentId: null }],
    ['updateCategory to root', (a: StudiesHttpAdapter) => a.updateCategory('c-1', { parentId: null }), 'patch', '/categories/c-1', { parentId: null }],
    ['updateCategory rename only', (a: StudiesHttpAdapter) => a.updateCategory('c-1', { name: 'X' }), 'patch', '/categories/c-1', { name: 'X' }],
    ['createKind', (a: StudiesHttpAdapter) => a.createKind('Lab'), 'post', '/note-kinds', { name: 'Lab' }],
    ['renameKind', (a: StudiesHttpAdapter) => a.renameKind('k-1', 'Lab'), 'patch', '/note-kinds/k-1', { name: 'Lab' }],
    ['createSubject', (a: StudiesHttpAdapter) => a.createSubject({ categoryId: 'c-1', name: 'S', description: null }), 'post', '/subjects', { categoryId: 'c-1', name: 'S', description: null }],
    ['updateSubject clears description', (a: StudiesHttpAdapter) => a.updateSubject('s-1', { description: null }), 'patch', '/subjects/s-1', { description: null }],
  ] as const)('%s sends %s %s with the exact body', async (_name, call, method, path, body) => {
    await call(adapter)
    expect(http[method]).toHaveBeenCalledWith(path, body)
    const sent = vi.mocked(http[method]).mock.calls[0][1] as Record<string, unknown>
    expect(Object.keys(sent).sort()).toEqual(Object.keys(body).sort()) // absent keys stay absent
  })

  it('unwraps the created entity', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: { id: 'k-9', name: 'Lab', noteCount: 0 } })
    expect(await adapter.createKind('Lab')).toEqual({ id: 'k-9', name: 'Lab', noteCount: 0 })
  })

  it('lists kinds from GET /note-kinds', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [{ id: 'k', name: 'Summary', noteCount: 2 }], meta: { totalItems: 1 } })
    expect(await adapter.listKinds()).toEqual([{ id: 'k', name: 'Summary', noteCount: 2 }])
    expect(http.get).toHaveBeenCalledWith('/note-kinds')
  })

  it.each([
    ['deleteCategory', (a: StudiesHttpAdapter) => a.deleteCategory('c-1'), '/categories/c-1'],
    ['deleteKind', (a: StudiesHttpAdapter) => a.deleteKind('k-1'), '/note-kinds/k-1'],
    ['deleteSubject', (a: StudiesHttpAdapter) => a.deleteSubject('s-1'), '/subjects/s-1'],
  ])('%s sends DELETE %s and resolves undefined on 204', async (_name, call, path) => {
    await expect(call(adapter)).resolves.toBeUndefined()
    expect(http.delete).toHaveBeenCalledWith(path)
  })

  it('maps a 422 to StudiesValidationError with every violation', async () => {
    const details = [
      { field: 'name', rule: 'required', message: 'name must not be empty' },
      { field: 'color', rule: 'format', message: 'color must be a 6-digit hex value like #22D3EE' },
    ]
    vi.mocked(http.post).mockRejectedValue(
      new HttpError(422, 'Unprocessable Entity', { error: { code: 'validation_failed', message: 'validation failed', details } })
    )
    const e = await adapter.createCategory({ name: '', color: 'x', parentId: null }).catch((err: unknown) => err)
    expect(e).toBeInstanceOf(StudiesValidationError)
    expect((e as StudiesValidationError).violations).toEqual(details)
    expect((e as Error).message).toBe('name must not be empty; color must be a 6-digit hex value like #22D3EE')
  })

  it.each(['duplicate_name', 'in_use', 'stale_version'] as const)('maps a 409 %s to StudiesConflictError', async (rule) => {
    vi.mocked(http.delete).mockRejectedValue(
      new HttpError(409, 'Conflict', { error: { code: 'conflict', message: 'busy', details: [{ field: 'id', rule, message: 'busy' }] } })
    )
    const e = await adapter.deleteCategory('c-1').catch((err: unknown) => err)
    expect(e).toBeInstanceOf(StudiesConflictError)
    expect(e).toMatchObject({ field: 'id', rule, message: 'busy' })
  })

  it.each([
    ['updateCategory', (a: StudiesHttpAdapter) => a.updateCategory('c', { name: 'X' }), 'patch'],
    ['deleteSubject', (a: StudiesHttpAdapter) => a.deleteSubject('s'), 'delete'],
  ] as const)('maps a 404 on %s to StudiesNotFoundError', async (_name, call, method) => {
    vi.mocked(http[method]).mockRejectedValue(
      new HttpError(404, 'Not Found', { error: { code: 'not_found', message: 'resource not found' } })
    )
    expect(await call(adapter).catch((err: unknown) => err)).toBeInstanceOf(StudiesNotFoundError)
  })

  it('other failures stay plain errors with the API message', async () => {
    vi.mocked(http.post).mockRejectedValue(new HttpError(500, 'Internal', { error: { code: 'internal', message: 'internal server error' } }))
    const e = await adapter.createKind('X').catch((err: unknown) => err)
    expect(e).toBeInstanceOf(Error)
    expect(e).not.toBeInstanceOf(StudiesConflictError)
    expect(e).not.toBeInstanceOf(HttpError)
    expect((e as Error).message).toBe('internal server error')
  })
})

describe('StudiesHttpAdapter note writes (S09b-2)', () => {
  let http: IHttpClient
  let adapter: StudiesHttpAdapter
  const input = { title: 'T', kindId: 'k-1', content: '', tags: ['iam'], slabLinks: [] }

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new StudiesHttpAdapter(http)
    vi.mocked(http.post).mockResolvedValue({ data: { id: 'n-1' } })
    vi.mocked(http.patch).mockResolvedValue({ data: { id: 'n-1', version: 2 } })
    vi.mocked(http.delete).mockResolvedValue(undefined)
  })

  it('createNote posts to the subject', async () => {
    await adapter.createNote('s-1', input)
    expect(http.post).toHaveBeenCalledWith('/subjects/s-1/notes', input)
  })

  it('updateNote patches with the version and only the given fields', async () => {
    expect(await adapter.updateNote('n-1', { version: 1, title: 'New' })).toEqual({ id: 'n-1', version: 2 })
    expect(http.patch).toHaveBeenCalledWith('/notes/n-1', { version: 1, title: 'New' })
    expect(Object.keys(vi.mocked(http.patch).mock.calls[0][1] as object).sort()).toEqual(['title', 'version'])
  })

  it('deleteNote sends DELETE and resolves on 204', async () => {
    await expect(adapter.deleteNote('n-1')).resolves.toBeUndefined()
    expect(http.delete).toHaveBeenCalledWith('/notes/n-1')
  })

  it('a 404 on create (unknown subject) is StudiesNotFoundError', async () => {
    vi.mocked(http.post).mockRejectedValue(new HttpError(404, 'Not Found', { error: { code: 'not_found', message: 'resource not found' } }))
    expect(await adapter.createNote('s-x', input).catch((e: unknown) => e)).toBeInstanceOf(StudiesNotFoundError)
  })

  it('a 409 stale_version is a StudiesConflictError on version', async () => {
    const message = 'the note was changed since you read it; reload and re-apply your edit'
    vi.mocked(http.patch).mockRejectedValue(
      new HttpError(409, 'Conflict', { error: { code: 'conflict', message, details: [{ field: 'version', rule: 'stale_version', message }] } })
    )
    const e = await adapter.updateNote('n-1', { version: 1, content: 'x' }).catch((err: unknown) => err)
    expect(e).toBeInstanceOf(StudiesConflictError)
    expect(e).toMatchObject({ field: 'version', rule: 'stale_version', message })
  })
})
