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

export interface NoteKind {
  id: string
  name: string
  noteCount: number
}

export interface CreateCategoryInput {
  name: string
  color: string
  /** null creates a root category. */
  parentId: string | null
}

/** Absent keys are unchanged; `parentId: null` moves the category to the root. */
export interface CategoryPatch {
  name?: string
  color?: string
  parentId?: string | null
}

export interface CreateSubjectInput {
  categoryId: string
  name: string
  description: string | null
}

/** Absent keys are unchanged; `description: null` clears it. */
export interface SubjectPatch {
  categoryId?: string
  name?: string
  description?: string | null
}

/**
 * Writes reject with the typed errors of `@/application/errors`:
 * StudiesValidationError (422), StudiesConflictError (409) and
 * StudiesNotFoundError (the target is gone).
 */
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

  createCategory(input: CreateCategoryInput): Promise<Category>
  updateCategory(id: string, patch: CategoryPatch): Promise<Category>
  deleteCategory(id: string): Promise<void>

  /** Alive kinds, alphabetical, each with its alive note count. */
  listKinds(): Promise<NoteKind[]>
  createKind(name: string): Promise<NoteKind>
  renameKind(id: string, name: string): Promise<NoteKind>
  deleteKind(id: string): Promise<void>

  createSubject(input: CreateSubjectInput): Promise<Subject>
  updateSubject(id: string, patch: SubjectPatch): Promise<Subject>
  deleteSubject(id: string): Promise<void>
}
