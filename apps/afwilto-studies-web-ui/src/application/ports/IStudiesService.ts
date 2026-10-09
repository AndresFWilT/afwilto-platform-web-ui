// Domain-language read port for the studies knowledge base (Spec 16 §9.2,
// Slice 07). No HTTP type crosses it: adapters translate wire shapes and
// errors, pages only see these types.

export interface Category {
  id: string
  parentId: string | null
  name: string
  color: string
  path: string
  depth: number
  subjectCount: number
}

export interface CategoryRef {
  id: string
  name: string
  color: string
  path: string
}

export interface Subject {
  id: string
  categoryId: string
  category: CategoryRef
  name: string
  description: string | null
  noteCount: number
  createdAt: string
  updatedAt: string
}

export interface NoteKindRef {
  id: string
  name: string
}

export interface NoteSummary {
  id: string
  subjectId: string
  title: string
  kind: NoteKindRef
  tags: string[]
  createdAt: string
  updatedAt: string
  version: number
}

export interface TaggedNoteSummary extends NoteSummary {
  subject: { id: string; name: string }
  category: CategoryRef
}

export interface SlabLink {
  label: string
  path: string
}

export interface Note extends NoteSummary {
  content: string
  slabLinks: SlabLink[]
}

export type SortField = 'title' | 'createdAt' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'

export interface NoteSort {
  field: SortField
  order: SortOrder
}

export const DEFAULT_NOTE_SORT: NoteSort = { field: 'title', order: 'asc' }

export interface IStudiesService {
  listCategories(): Promise<Category[]>
  /** Every alive subject; the library groups them by categoryId. */
  listSubjects(): Promise<Subject[]>
  /** null when the subject does not exist or is deleted. */
  getSubject(id: string): Promise<Subject | null>
  /** null when the subject does not exist or is deleted. */
  listSubjectNotes(subjectId: string, sort?: NoteSort): Promise<NoteSummary[] | null>
  /** null when the note does not exist or is deleted. */
  getNote(id: string): Promise<Note | null>
  /** The tag is sent raw; it is normalized like the backend does. */
  listNotesByTag(tag: string, sort?: NoteSort): Promise<TaggedNoteSummary[]>
}
