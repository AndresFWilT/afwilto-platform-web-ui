import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { StudiesHttpAdapter } from '../src/infrastructure/adapters/http/StudiesHttpAdapter'

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
