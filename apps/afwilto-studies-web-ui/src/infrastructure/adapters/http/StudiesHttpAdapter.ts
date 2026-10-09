import { HttpError, type IHttpClient } from '@afwilto/http-client'
import {
  DEFAULT_NOTE_SORT,
  type Category,
  type CategoryPatch,
  type CreateCategoryInput,
  type CreateNoteInput,
  type CreateSubjectInput,
  type IStudiesService,
  type NoteKind,
  type NotePatch,
  type SubjectPatch,
  type Note,
  type NoteSort,
  type NoteSummary,
  type Subject,
  type TaggedNoteSummary,
} from '@/application/ports'
import {
  StudiesConflictError,
  StudiesNotFoundError,
  StudiesValidationError,
  type ConflictRule,
  type Violation,
} from '@/application/errors'

// The read port mirrors the OpenAPI schemas field for field (api/openapi.yaml),
// so the wire bodies need no mapping beyond unwrapping the envelope.

interface ApiEnvelope<T> {
  data: T
}

interface WireError {
  error?: { code?: string; message?: string; details?: Violation[] }
}

/** HTTP failures → the port's domain errors; status codes never leave the adapter. */
function translateError(e: unknown): Error {
  if (e instanceof HttpError) {
    const err = (e.body as WireError | null)?.error
    const details = Array.isArray(err?.details) ? err!.details : []
    if (e.status === 422 && details.length) return new StudiesValidationError(details)
    if (e.status === 409 && details.length) {
      const [first] = details
      return new StudiesConflictError(first.field, first.rule as ConflictRule, first.message || err?.message || 'conflict')
    }
    if (e.status === 404) return new StudiesNotFoundError(err?.message)
    if (details.length) return new Error(details.map((d) => d.message).join('; '))
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

  listKinds(): Promise<NoteKind[]> {
    return this.data<NoteKind[]>('/note-kinds')
  }

  createCategory(input: CreateCategoryInput): Promise<Category> {
    return this.send<Category>('post', '/categories', input)
  }

  updateCategory(id: string, patch: CategoryPatch): Promise<Category> {
    return this.send<Category>('patch', `/categories/${encodeURIComponent(id)}`, patch)
  }

  deleteCategory(id: string): Promise<void> {
    return this.remove(`/categories/${encodeURIComponent(id)}`)
  }

  createKind(name: string): Promise<NoteKind> {
    return this.send<NoteKind>('post', '/note-kinds', { name })
  }

  renameKind(id: string, name: string): Promise<NoteKind> {
    return this.send<NoteKind>('patch', `/note-kinds/${encodeURIComponent(id)}`, { name })
  }

  deleteKind(id: string): Promise<void> {
    return this.remove(`/note-kinds/${encodeURIComponent(id)}`)
  }

  createSubject(input: CreateSubjectInput): Promise<Subject> {
    return this.send<Subject>('post', '/subjects', input)
  }

  updateSubject(id: string, patch: SubjectPatch): Promise<Subject> {
    return this.send<Subject>('patch', `/subjects/${encodeURIComponent(id)}`, patch)
  }

  deleteSubject(id: string): Promise<void> {
    return this.remove(`/subjects/${encodeURIComponent(id)}`)
  }

  createNote(subjectId: string, input: CreateNoteInput): Promise<Note> {
    return this.send<Note>('post', `/subjects/${encodeURIComponent(subjectId)}/notes`, input)
  }

  updateNote(id: string, patch: NotePatch): Promise<Note> {
    return this.send<Note>('patch', `/notes/${encodeURIComponent(id)}`, patch)
  }

  deleteNote(id: string): Promise<void> {
    return this.remove(`/notes/${encodeURIComponent(id)}`)
  }

  /** POST/PATCH with the body as given: absent keys stay absent, null stays null. */
  private async send<T>(method: 'post' | 'patch', path: string, body: object): Promise<T> {
    try {
      return (await this.http[method]<ApiEnvelope<T>>(path, body)).data
    } catch (e) {
      throw translateError(e)
    }
  }

  private async remove(path: string): Promise<void> {
    try {
      await this.http.delete<void>(path)
    } catch (e) {
      throw translateError(e)
    }
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
