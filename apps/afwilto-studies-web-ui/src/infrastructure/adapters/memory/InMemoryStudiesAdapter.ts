import {
  DEFAULT_NOTE_SORT,
  type Category,
  type CategoryPatch,
  type CategoryRef,
  type CreateCategoryInput,
  type CreateSubjectInput,
  type IStudiesService,
  type Note,
  type NoteKind,
  type NoteKindRef,
  type NoteSort,
  type NoteSummary,
  type SlabLink,
  type Subject,
  type SubjectPatch,
  type TaggedNoteSummary,
} from '@/application/ports'
import { StudiesConflictError, StudiesNotFoundError, StudiesValidationError, type Violation } from '@/application/errors'
import { trimSpace } from '@/domain/validation'

/** Rows as studies-mngr stores them; `deletedAt` marks a logical delete (FR-0). */
export interface StudiesSeed {
  categories: Array<{ id: string; parentId: string | null; name: string; color: string; deletedAt?: string }>
  kinds: Array<NoteKindRef & { deletedAt?: string }>
  subjects: Array<{
    id: string
    categoryId: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
    deletedAt?: string
  }>
  notes: Array<{
    id: string
    subjectId: string
    title: string
    kindId: string
    tags: string[]
    content: string
    slabLinks: SlabLink[]
    createdAt: string
    updatedAt: string
    version: number
    deletedAt?: string
  }>
}

export interface InMemoryOptions {
  now?: () => string
  newId?: () => string
}

type SeedCategory = StudiesSeed['categories'][number]
type SeedSubject = StudiesSeed['subjects'][number]
type SeedNote = StudiesSeed['notes'][number]

const MAX_DEPTH = 5
const TAG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_TAG_LENGTH = 40
const TAG_MESSAGE = 'tag must be lowercase kebab-case, 1–40 characters'
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

/** The backend's tag normalization (trim, lowercase, whitespace runs → '-'). */
function normalizeTag(raw: string): string {
  const tag = raw.trim().split(/\s+/).filter(Boolean).join('-').toLowerCase()
  if (tag === '' || [...tag].length > MAX_TAG_LENGTH || !TAG_PATTERN.test(tag)) {
    throw new Error(TAG_MESSAGE)
  }
  return tag
}

/** Byte-order comparison, like Postgres COLLATE "C". */
function compareBytes(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** The backend's ORDER BY: the chosen column, then lower(title) asc, then id asc. */
function compareNotes(sort: NoteSort) {
  const direction = sort.order === 'desc' ? -1 : 1
  return (a: SeedNote, b: SeedNote): number => {
    const primary =
      sort.field === 'title'
        ? compareBytes(a.title.toLowerCase(), b.title.toLowerCase())
        : Date.parse(a[sort.field]) - Date.parse(b[sort.field])
    return (
      primary * direction ||
      compareBytes(a.title.toLowerCase(), b.title.toLowerCase()) ||
      compareBytes(a.id, b.id)
    )
  }
}

const sameId = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const sameName = (a: string, b: string) => trimSpace(a).toLowerCase() === trimSpace(b).toLowerCase()

// studies-mngr stops at the first failing check, so each check throws on its own.

/** The backend's single-line name rule (strings.TrimSpace, then required → control → length). */
function checkName(raw: string, max: number): string {
  const violations: Violation[] = []
  const name = trimSpace(raw)
  if (name === '') violations.push({ field: 'name', rule: 'required', message: 'name must not be empty' })
  else if (CONTROL.test(name)) violations.push({ field: 'name', rule: 'format', message: 'name must not contain control characters' })
  else if ([...name].length > max) violations.push({ field: 'name', rule: 'max_length', message: `name must be at most ${max} characters` })
  throwIfAny(violations)
  return name
}

function checkColor(raw: string): string {
  const color = trimSpace(raw)
  if (!HEX_COLOR.test(color)) throw violation('color', 'format', 'color must be a 6-digit hex value like #22D3EE')
  return color.toUpperCase()
}

/** Nil or blank means "no description"; NUL and > 2000 characters are rejected. */
function checkDescription(raw: string | null): string | null {
  const violations: Violation[] = []
  if (raw === null || raw === '') return null
  if (raw.includes('\u0000')) violations.push({ field: 'description', rule: 'format', message: 'description must not contain NUL characters' })
  else if ([...raw].length > 2000) {
    violations.push({ field: 'description', rule: 'max_length', message: 'description must be at most 2000 characters' })
  }
  throwIfAny(violations)
  return raw
}

/** The HTTP handler's id check, before any use-case rule (uuidField in errors.go). */
function checkUuid(field: string, value: string): string {
  if (!UUID.test(value)) throw violation(field, 'format', `${field} must be a UUID`)
  return value.toLowerCase()
}

/** OpenAPI minProperties 1: an empty PATCH is rejected before the id is looked up. */
function checkNotEmpty(patch: object, message: string) {
  if (Object.keys(patch).length === 0) throw violation('body', 'required', message)
}

function throwIfAny(violations: Violation[]) {
  if (violations.length) throw new StudiesValidationError(violations)
}

const violation = (field: string, rule: string, message: string) => new StudiesValidationError([{ field, rule, message }])

/**
 * In-memory implementation of the port, faithful to studies-mngr semantics:
 * the same rules, fields and messages, and logical deletes. It is the test
 * fake and the offline dev store (no VITE_API_URL).
 */
export class InMemoryStudiesAdapter implements IStudiesService {
  private readonly seed: StudiesSeed
  private readonly now: () => string
  private readonly newId: () => string

  constructor(seed: StudiesSeed = { categories: [], kinds: [], subjects: [], notes: [] }, options: InMemoryOptions = {}) {
    this.seed = structuredClone(seed)
    this.now = options.now ?? (() => new Date().toISOString())
    this.newId = options.newId ?? (() => crypto.randomUUID())
  }

  // ── reads ──────────────────────────────────────────────────────────────────

  async listCategories(): Promise<Category[]> {
    return this.categories()
      .map((c) => {
        const chain = this.ancestry(c.id)
        // The backend's sort key: lower-cased names joined by chr(1), which sorts
        // below every printable character, so a node directly follows its parent.
        const sortKey = chain.map((a) => a.name.toLowerCase()).join('\u0001')
        return { sortKey, category: this.toCategory(c) }
      })
      .sort((a, b) => compareBytes(a.sortKey, b.sortKey) || compareBytes(a.category.id, b.category.id))
      .map(({ category }) => category)
  }

  async listSubjects(): Promise<Subject[]> {
    return this.subjects()
      .map((s) => this.toSubject(s))
      .sort((a, b) => compareBytes(a.name.toLowerCase(), b.name.toLowerCase()) || compareBytes(a.id, b.id))
  }

  async getSubject(id: string): Promise<Subject | null> {
    const subject = this.findSubject(id)
    return subject ? this.toSubject(subject) : null
  }

  async listSubjectNotes(subjectId: string, sort: NoteSort = DEFAULT_NOTE_SORT): Promise<NoteSummary[] | null> {
    const subject = this.findSubject(subjectId)
    if (!subject) return null
    return this.notes()
      .filter((n) => n.subjectId === subject.id)
      .sort(compareNotes(sort))
      .map((n) => this.toSummary(n))
  }

  async getNote(id: string): Promise<Note | null> {
    const note = this.notes().find((n) => sameId(n.id, id))
    if (!note) return null
    return { ...this.toSummary(note), content: note.content, slabLinks: note.slabLinks.map((l) => ({ ...l })) }
  }

  async listNotesByTag(rawTag: string, sort: NoteSort = DEFAULT_NOTE_SORT): Promise<TaggedNoteSummary[]> {
    const tag = normalizeTag(rawTag)
    return this.notes()
      .filter((n) => n.tags.includes(tag))
      .sort(compareNotes(sort))
      .map((n) => {
        const subject = this.findSubject(n.subjectId)!
        return {
          ...this.toSummary(n),
          subject: { id: subject.id, name: subject.name },
          category: this.categoryRef(subject.categoryId),
        }
      })
  }

  async listKinds(): Promise<NoteKind[]> {
    return this.kinds()
      .map((k) => this.toKind(k))
      .sort((a, b) => compareBytes(a.name.toLowerCase(), b.name.toLowerCase()) || compareBytes(a.id, b.id))
  }

  // ── categories ─────────────────────────────────────────────────────────────

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const parentRef = input.parentId === null ? null : checkUuid('parentId', input.parentId)
    const name = checkName(input.name, 60)
    const color = checkColor(input.color)
    const parentId = parentRef === null ? null : this.requireParent(parentRef).id
    if (parentId !== null && this.ancestry(parentId).length + 1 > MAX_DEPTH) {
      throw violation('parentId', 'max_depth', 'the category tree is limited to 5 levels')
    }
    this.assertUniqueSibling(parentId, name)
    const row: SeedCategory = { id: this.newId(), parentId, name, color }
    this.seed.categories.push(row)
    return this.toCategory(row)
  }

  async updateCategory(id: string, patch: CategoryPatch): Promise<Category> {
    checkNotEmpty(patch, 'at least one of name, color or parentId must be provided')
    if (typeof patch.parentId === 'string') checkUuid('parentId', patch.parentId)
    const row = this.findCategory(id)
    if (!row) throw new StudiesNotFoundError()
    const name = patch.name === undefined ? row.name : checkName(patch.name, 60)
    const color = patch.color === undefined ? row.color : checkColor(patch.color)

    let parentId = row.parentId
    if (patch.parentId !== undefined) {
      parentId = patch.parentId === null ? null : this.requireParent(patch.parentId).id
      if (parentId !== null) {
        if (this.ancestry(parentId).some((a) => a.id === row.id)) {
          throw violation('parentId', 'cycle', 'a category cannot be placed under itself or one of its descendants')
        }
        if (this.ancestry(parentId).length + this.height(row.id) > MAX_DEPTH) {
          throw violation('parentId', 'max_depth', 'the category tree is limited to 5 levels')
        }
      }
    }
    this.assertUniqueSibling(parentId, name, row.id)
    Object.assign(row, { name, color, parentId })
    return this.toCategory(row)
  }

  async deleteCategory(id: string): Promise<void> {
    const row = this.findCategory(id)
    if (!row) throw new StudiesNotFoundError()
    // The use case's messages: children are checked before subjects (usecase/categories.go).
    const children = this.categories().filter((c) => c.parentId === row.id).length
    if (children > 0) {
      throw new StudiesConflictError('id', 'in_use', `category has ${children} subcategories; move or delete them first`)
    }
    const subjects = this.subjects().filter((s) => s.categoryId === row.id).length
    if (subjects > 0) {
      throw new StudiesConflictError('id', 'in_use', `category has ${subjects} subjects; move or delete them first`)
    }
    row.deletedAt = this.now()
  }

  // ── note kinds ─────────────────────────────────────────────────────────────

  async createKind(rawName: string): Promise<NoteKind> {
    const name = checkName(rawName, 40)
    this.assertUniqueKind(name)
    const row = { id: this.newId(), name }
    this.seed.kinds.push(row)
    return this.toKind(row)
  }

  async renameKind(id: string, rawName: string): Promise<NoteKind> {
    const row = this.kinds().find((k) => sameId(k.id, id))
    if (!row) throw new StudiesNotFoundError()
    const name = checkName(rawName, 40)
    this.assertUniqueKind(name, row.id)
    row.name = name
    return this.toKind(row)
  }

  async deleteKind(id: string): Promise<void> {
    const row = this.kinds().find((k) => sameId(k.id, id))
    if (!row) throw new StudiesNotFoundError()
    const notes = this.notes().filter((n) => n.kindId === row.id).length
    if (notes > 0) {
      throw new StudiesConflictError('id', 'in_use', `note kind is used by ${notes} notes; change or delete them first`)
    }
    row.deletedAt = this.now()
  }

  // ── subjects ───────────────────────────────────────────────────────────────

  async createSubject(input: CreateSubjectInput): Promise<Subject> {
    const categoryRef = checkUuid('categoryId', input.categoryId)
    const name = checkName(input.name, 120)
    const description = checkDescription(input.description)
    const category = this.findCategory(categoryRef)
    if (!category) throw violation('categoryId', 'not_found', 'category does not exist')
    this.assertUniqueSubject(category.id, name)
    const now = this.now()
    const row: SeedSubject = { id: this.newId(), categoryId: category.id, name, description, createdAt: now, updatedAt: now }
    this.seed.subjects.push(row)
    return this.toSubject(row)
  }

  async updateSubject(id: string, patch: SubjectPatch): Promise<Subject> {
    checkNotEmpty(patch, 'at least one of categoryId, name or description must be provided')
    if (patch.categoryId !== undefined) checkUuid('categoryId', patch.categoryId)
    const row = this.findSubject(id)
    if (!row) throw new StudiesNotFoundError()
    const name = patch.name === undefined ? row.name : checkName(patch.name, 120)
    const description = patch.description === undefined ? row.description : checkDescription(patch.description)
    let categoryId = row.categoryId
    if (patch.categoryId !== undefined) {
      const category = this.findCategory(patch.categoryId)
      if (!category) throw violation('categoryId', 'not_found', 'category does not exist')
      categoryId = category.id
    }
    this.assertUniqueSubject(categoryId, name, row.id)
    Object.assign(row, { name, description, categoryId, updatedAt: this.now() })
    return this.toSubject(row)
  }

  async deleteSubject(id: string): Promise<void> {
    const row = this.findSubject(id)
    if (!row) throw new StudiesNotFoundError()
    const notes = this.notes().filter((n) => n.subjectId === row.id).length
    if (notes > 0) {
      throw new StudiesConflictError('id', 'in_use', `subject has ${notes} notes; move or delete them first`)
    }
    row.deletedAt = this.now()
  }

  // ── alive rows and lookups ─────────────────────────────────────────────────

  private categories() {
    return this.seed.categories.filter((c) => !c.deletedAt)
  }

  private kinds() {
    return this.seed.kinds.filter((k) => !k.deletedAt)
  }

  private subjects() {
    return this.seed.subjects.filter((s) => !s.deletedAt)
  }

  private notes() {
    return this.seed.notes.filter((n) => !n.deletedAt)
  }

  private findCategory(id: string) {
    return this.categories().find((c) => sameId(c.id, id))
  }

  private findSubject(id: string) {
    return this.subjects().find((s) => sameId(s.id, id))
  }

  private requireParent(id: string): SeedCategory {
    const parent = this.findCategory(id)
    if (!parent) throw violation('parentId', 'not_found', 'parent category does not exist')
    return parent
  }

  private assertUniqueSibling(parentId: string | null, name: string, selfId?: string) {
    const clash = this.categories().some((c) => c.parentId === parentId && c.id !== selfId && sameName(c.name, name))
    if (clash) throw new StudiesConflictError('name', 'duplicate_name', 'a sibling category with this name already exists')
  }

  private assertUniqueKind(name: string, selfId?: string) {
    if (this.kinds().some((k) => k.id !== selfId && sameName(k.name, name))) {
      throw new StudiesConflictError('name', 'duplicate_name', 'a note kind with this name already exists')
    }
  }

  private assertUniqueSubject(categoryId: string, name: string, selfId?: string) {
    const clash = this.subjects().some((s) => s.categoryId === categoryId && s.id !== selfId && sameName(s.name, name))
    if (clash) throw new StudiesConflictError('name', 'duplicate_name', 'a subject with this name already exists in the category')
  }

  /** Root-first chain from the root down to the category itself. */
  private ancestry(id: string): SeedCategory[] {
    const alive = this.categories()
    const chain: SeedCategory[] = []
    let current = alive.find((c) => c.id === id)
    while (current && chain.length <= alive.length) {
      chain.unshift(current)
      const parentId = current.parentId
      current = parentId === null ? undefined : alive.find((c) => c.id === parentId)
    }
    return chain
  }

  /** Levels in the subtree rooted at `id`, 1 for a leaf. */
  private height(id: string): number {
    const children = this.categories().filter((c) => c.parentId === id)
    return 1 + Math.max(0, ...children.map((c) => this.height(c.id)))
  }

  // ── mapping ────────────────────────────────────────────────────────────────

  private toCategory(c: SeedCategory): Category {
    const chain = this.ancestry(c.id)
    return {
      id: c.id,
      parentId: c.parentId,
      name: c.name,
      color: c.color,
      path: chain.map((a) => a.name).join(' / '),
      depth: chain.length,
      subjectCount: this.subjects().filter((s) => s.categoryId === c.id).length,
    }
  }

  private categoryRef(id: string): CategoryRef {
    const chain = this.ancestry(id)
    const category = chain[chain.length - 1]
    return { id: category.id, name: category.name, color: category.color, path: chain.map((c) => c.name).join(' / ') }
  }

  private toKind(k: NoteKindRef): NoteKind {
    return { id: k.id, name: k.name, noteCount: this.notes().filter((n) => n.kindId === k.id).length }
  }

  private toSubject(s: SeedSubject): Subject {
    return {
      id: s.id,
      categoryId: s.categoryId,
      category: this.categoryRef(s.categoryId),
      name: s.name,
      description: s.description,
      noteCount: this.notes().filter((n) => n.subjectId === s.id).length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }
  }

  private toSummary(n: SeedNote): NoteSummary {
    const kind = this.seed.kinds.find((k) => k.id === n.kindId)
    return {
      id: n.id,
      subjectId: n.subjectId,
      title: n.title,
      kind: { id: n.kindId, name: kind?.name ?? '' },
      tags: [...n.tags].sort(compareBytes),
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      version: n.version,
    }
  }
}
