import {
  DEFAULT_NOTE_SORT,
  type Category,
  type CategoryRef,
  type IStudiesService,
  type Note,
  type NoteKindRef,
  type NoteSort,
  type NoteSummary,
  type SlabLink,
  type Subject,
  type TaggedNoteSummary,
} from '@/application/ports'

export interface StudiesSeed {
  categories: Array<{ id: string; parentId: string | null; name: string; color: string }>
  kinds: NoteKindRef[]
  subjects: Array<{
    id: string
    categoryId: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
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
  }>
}

type SeedNote = StudiesSeed['notes'][number]

const TAG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_TAG_LENGTH = 40
const TAG_MESSAGE = 'tag must be lowercase kebab-case, 1–40 characters'

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

/**
 * Read-only in-memory implementation of the port, faithful to the
 * studies-mngr semantics: test fake and offline dev store (no VITE_API_URL).
 */
export class InMemoryStudiesAdapter implements IStudiesService {
  private readonly seed: StudiesSeed

  constructor(seed: StudiesSeed = { categories: [], kinds: [], subjects: [], notes: [] }) {
    this.seed = structuredClone(seed)
  }

  async listCategories(): Promise<Category[]> {
    return this.seed.categories
      .map((c) => {
        const chain = this.ancestry(c.id)
        // The backend's sort key: lower-cased names joined by chr(1), which sorts
        // below every printable character, so a node directly follows its parent.
        const sortKey = chain.map((a) => a.name.toLowerCase()).join('\u0001')
        const category: Category = {
          id: c.id,
          parentId: c.parentId,
          name: c.name,
          color: c.color,
          path: chain.map((a) => a.name).join(' / '),
          depth: chain.length,
          subjectCount: this.seed.subjects.filter((s) => s.categoryId === c.id).length,
        }
        return { sortKey, category }
      })
      .sort((a, b) => compareBytes(a.sortKey, b.sortKey) || compareBytes(a.category.id, b.category.id))
      .map(({ category }) => category)
  }

  async listSubjects(): Promise<Subject[]> {
    return this.seed.subjects
      .map((s) => this.toSubject(s))
      .sort((a, b) => compareBytes(a.name.toLowerCase(), b.name.toLowerCase()) || compareBytes(a.id, b.id))
  }

  async getSubject(id: string): Promise<Subject | null> {
    const subject = this.findSubject(id)
    return subject ? this.toSubject(subject) : null
  }

  async listSubjectNotes(subjectId: string, sort: NoteSort = DEFAULT_NOTE_SORT): Promise<NoteSummary[] | null> {
    if (!this.findSubject(subjectId)) return null
    return this.seed.notes
      .filter((n) => n.subjectId === subjectId)
      .sort(compareNotes(sort))
      .map((n) => this.toSummary(n))
  }

  async getNote(id: string): Promise<Note | null> {
    const note = this.seed.notes.find((n) => n.id.toLowerCase() === id.toLowerCase())
    if (!note) return null
    return { ...this.toSummary(note), content: note.content, slabLinks: note.slabLinks.map((l) => ({ ...l })) }
  }

  async listNotesByTag(rawTag: string, sort: NoteSort = DEFAULT_NOTE_SORT): Promise<TaggedNoteSummary[]> {
    const tag = normalizeTag(rawTag)
    return this.seed.notes
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

  // ── helpers ────────────────────────────────────────────────────────────────

  /** Root-first chain from the root down to the category itself. */
  private ancestry(id: string): StudiesSeed['categories'] {
    const chain: StudiesSeed['categories'] = []
    let current = this.seed.categories.find((c) => c.id === id)
    while (current && chain.length <= this.seed.categories.length) {
      chain.unshift(current)
      const parentId = current.parentId
      current = parentId === null ? undefined : this.seed.categories.find((c) => c.id === parentId)
    }
    return chain
  }

  private categoryRef(id: string): CategoryRef {
    const chain = this.ancestry(id)
    const category = chain[chain.length - 1]
    return { id: category.id, name: category.name, color: category.color, path: chain.map((c) => c.name).join(' / ') }
  }

  private findSubject(id: string) {
    return this.seed.subjects.find((s) => s.id.toLowerCase() === id.toLowerCase())
  }

  private toSubject(s: StudiesSeed['subjects'][number]): Subject {
    return {
      id: s.id,
      categoryId: s.categoryId,
      category: this.categoryRef(s.categoryId),
      name: s.name,
      description: s.description,
      noteCount: this.seed.notes.filter((n) => n.subjectId === s.id).length,
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
