import { HttpError, type IHttpClient } from '@afwilto/http-client'
import {
  DEFAULT_NOTE_SORT,
  type Category,
  type IStudiesService,
  type Note,
  type NoteSort,
  type NoteSummary,
  type Subject,
  type TaggedNoteSummary,
} from '@/application/ports'

// The read port mirrors the OpenAPI schemas field for field (api/openapi.yaml),
// so the wire bodies need no mapping beyond unwrapping the envelope.

interface ApiEnvelope<T> {
  data: T
}

interface WireError {
  error?: { code?: string; message?: string; details?: Array<{ field: string; rule: string; message: string }> }
}

function translateError(e: unknown): Error {
  if (e instanceof HttpError) {
    const err = (e.body as WireError | null)?.error
    if (err && Array.isArray(err.details) && err.details.length) {
      return new Error(err.details.map((d) => d.message).join('; '))
    }
    if (err?.message) return new Error(err.message)
    return new Error(`Request failed (${e.status})`)
  }
  return e instanceof Error ? e : new Error(String(e))
}

function isNotFound(e: unknown): boolean {
  return e instanceof HttpError && e.status === 404
}

/** `sort` / `order` are omitted for the default, so URLs stay canonical. */
function sortParams(params: URLSearchParams, sort: NoteSort): URLSearchParams {
  if (sort.field !== DEFAULT_NOTE_SORT.field || sort.order !== DEFAULT_NOTE_SORT.order) {
    params.set('sort', sort.field)
    params.set('order', sort.order)
  }
  return params
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export class StudiesHttpAdapter implements IStudiesService {
  private readonly http: IHttpClient

  constructor(http: IHttpClient) {
    this.http = http
  }

  listCategories(): Promise<Category[]> {
    return this.data<Category[]>('/categories')
  }

  listSubjects(): Promise<Subject[]> {
    return this.data<Subject[]>('/subjects')
  }

  getSubject(id: string): Promise<Subject | null> {
    return this.dataOrNull<Subject>(`/subjects/${encodeURIComponent(id)}`)
  }

  listSubjectNotes(subjectId: string, sort: NoteSort = DEFAULT_NOTE_SORT): Promise<NoteSummary[] | null> {
    const path = `/subjects/${encodeURIComponent(subjectId)}/notes`
    return this.dataOrNull<NoteSummary[]>(withQuery(path, sortParams(new URLSearchParams(), sort)))
  }

  getNote(id: string): Promise<Note | null> {
    return this.dataOrNull<Note>(`/notes/${encodeURIComponent(id)}`)
  }

  listNotesByTag(tag: string, sort: NoteSort = DEFAULT_NOTE_SORT): Promise<TaggedNoteSummary[]> {
    return this.data<TaggedNoteSummary[]>(withQuery('/notes', sortParams(new URLSearchParams({ tag }), sort)))
  }

  private async data<T>(path: string): Promise<T> {
    try {
      return (await this.http.get<ApiEnvelope<T>>(path)).data
    } catch (e) {
      throw translateError(e)
    }
  }

  /** A 404 is a valid empty result (missing or deleted), not a failure. */
  private async dataOrNull<T>(path: string): Promise<T | null> {
    try {
      return (await this.http.get<ApiEnvelope<T>>(path)).data
    } catch (e) {
      if (isNotFound(e)) return null
      throw translateError(e)
    }
  }
}
