import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { InMemoryStudiesAdapter, type StudiesSeed } from '../../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import type { NoteSort, SortField, SortOrder } from '../../src/application/ports'
import { StudiesConflictError, StudiesNotFoundError, StudiesValidationError } from '../../src/application/errors'

const NOT_FOUND = { error: { code: 'not_found', message: 'resource not found' } }

function notFound(): never {
  throw new HttpError(404, 'Not Found', NOT_FOUND)
}

function list<T>(data: T[]) {
  return { data, meta: { totalItems: data.length } }
}

function sortFrom(params: URLSearchParams): NoteSort {
  return {
    field: (params.get('sort') ?? 'title') as SortField,
    order: (params.get('order') ?? 'asc') as SortOrder,
  }
}

async function asValidation<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    throw new HttpError(422, 'Unprocessable Entity', {
      error: { code: 'validation_failed', message: 'validation failed', details: [{ field: 'tag', rule: 'format', message }] },
    })
  }
}

/** studies-mngr's error envelopes for the port's domain errors (Spec 11 §8.1). */
async function asHttp<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (e) {
    if (e instanceof StudiesValidationError) {
      throw new HttpError(422, 'Unprocessable Entity', {
        error: { code: 'validation_failed', message: 'validation failed', details: e.violations },
      })
    }
    if (e instanceof StudiesConflictError) {
      throw new HttpError(409, 'Conflict', {
        error: { code: 'conflict', message: e.message, details: [{ field: e.field, rule: e.rule, message: e.message }] },
      })
    }
    if (e instanceof StudiesNotFoundError) notFound()
    throw e
  }
}

/**
 * A stand-in for studies-mngr that answers the read routes of api/openapi.yaml
 * with contract-shaped envelopes and error bodies. The data comes from the
 * in-memory adapter so both adapters are judged against the same store.
 */
export function contractApi(seed: StudiesSeed): IHttpClient & { calls: string[] } {
  const store = new InMemoryStudiesAdapter(seed)
  const calls: string[] = []
  const unsupported = () => Promise.reject(new Error('not part of the contract fake'))

  async function get(url: string): Promise<unknown> {
    calls.push(url)
    const parsed = new URL(url, 'http://studies.test')
    const segments = parsed.pathname.split('/').filter(Boolean)
    const params = parsed.searchParams

    if (segments[0] === 'categories' && segments.length === 1) return list(await store.listCategories())
    if (segments[0] === 'subjects' && segments.length === 1) return list(await store.listSubjects())
    if (segments[0] === 'subjects' && segments.length === 2) {
      return { data: (await store.getSubject(segments[1])) ?? notFound() }
    }
    if (segments[0] === 'subjects' && segments[2] === 'notes' && segments.length === 3) {
      return list((await store.listSubjectNotes(segments[1], sortFrom(params))) ?? notFound())
    }
    if (segments[0] === 'notes' && segments.length === 2) {
      return { data: (await store.getNote(segments[1])) ?? notFound() }
    }
    if (segments[0] === 'note-kinds' && segments.length === 1) return list(await store.listKinds())
    if (segments[0] === 'notes' && segments.length === 1) {
      const tag = params.get('tag') ?? ''
      return list(await asValidation(() => store.listNotesByTag(tag, sortFrom(params))))
    }
    notFound()
  }

  async function post(url: string, body: unknown): Promise<unknown> {
    calls.push(`POST ${url}`)
    const b = structuredClone(body) as never
    const notesOf = url.match(/^\/subjects\/([^/]+)\/notes$/)
    if (notesOf) return { data: await asHttp(() => store.createNote(notesOf[1], b)) }
    switch (url) {
      case '/categories':
        return { data: await asHttp(() => store.createCategory(b)) }
      case '/note-kinds':
        return { data: await asHttp(() => store.createKind((b as { name: string }).name)) }
      case '/subjects':
        return { data: await asHttp(() => store.createSubject(b)) }
    }
    notFound()
  }

  async function patch(url: string, body: unknown): Promise<unknown> {
    calls.push(`PATCH ${url}`)
    const [, resource, id] = url.split('/')
    const b = structuredClone(body) as never
    if (resource === 'categories') return { data: await asHttp(() => store.updateCategory(id, b)) }
    if (resource === 'note-kinds') return { data: await asHttp(() => store.renameKind(id, (b as { name: string }).name)) }
    if (resource === 'subjects') return { data: await asHttp(() => store.updateSubject(id, b)) }
    if (resource === 'notes') return { data: await asHttp(() => store.updateNote(id, b)) }
    notFound()
  }

  async function del(url: string): Promise<unknown> {
    calls.push(`DELETE ${url}`)
    const [, resource, id] = url.split('/')
    if (resource === 'categories') await asHttp(() => store.deleteCategory(id))
    else if (resource === 'note-kinds') await asHttp(() => store.deleteKind(id))
    else if (resource === 'subjects') await asHttp(() => store.deleteSubject(id))
    else if (resource === 'notes') await asHttp(() => store.deleteNote(id))
    else notFound()
    return undefined // 204 No Content
  }

  return {
    calls,
    get: get as IHttpClient['get'],
    post: post as IHttpClient['post'],
    patch: patch as IHttpClient['patch'],
    put: unsupported,
    delete: del as IHttpClient['delete'],
    postMultipart: unsupported,
  }
}
