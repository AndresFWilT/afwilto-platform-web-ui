import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { InMemoryStudiesAdapter, type StudiesSeed } from '../../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import type { NoteSort, SortField, SortOrder } from '../../src/application/ports'

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

/**
 * A stand-in for studies-mngr that answers the read routes of api/openapi.yaml
 * with contract-shaped envelopes and error bodies. The data comes from the
 * in-memory adapter so both adapters are judged against the same store.
 */
export function contractApi(seed: StudiesSeed): IHttpClient & { calls: string[] } {
  const store = new InMemoryStudiesAdapter(seed)
  const calls: string[] = []
  const unsupported = () => Promise.reject(new Error('read-only fake'))

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
    if (segments[0] === 'notes' && segments.length === 1) {
      const tag = params.get('tag') ?? ''
      return list(await asValidation(() => store.listNotesByTag(tag, sortFrom(params))))
    }
    notFound()
  }

  return {
    calls,
    get: get as IHttpClient['get'],
    post: unsupported,
    patch: unsupported,
    put: unsupported,
    delete: unsupported,
    postMultipart: unsupported,
  }
}
