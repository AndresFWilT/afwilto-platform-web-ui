import type {
  ICertificationJourneyService,
  Certification,
  CertificationCategory,
  CertificationPage,
  Category,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  ListQuery,
  CreateCertificationCommand,
  UpdateCertificationCommand,
  AttachmentKind,
  AttachmentMeta,
} from '@/application/ports'

function normalizePath(raw: string): string {
  return raw
    .split('/')
    .map(s => s.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('/')
}

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

function assertValidColor(color: string): void {
  if (!HEX_COLOR.test(color)) {
    throw new Error('color must be a 6-digit hex value like #22D3EE')
  }
}

function intersectsYear(cert: Certification, year: number): boolean {
  const start = cert.studyStartDate ?? cert.expectedExamDate
  const end = cert.expectedExamDate ?? cert.studyStartDate
  if (!start && !end) return false
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  return (start ?? yearStart) <= yearEnd && (end ?? yearEnd) >= yearStart
}

type Row = Certification & { _deleted: boolean }

/**
 * Mirrors the rules `PATCH /certifications/{id}` enforces server-side, with the
 * backend's own messages. Without this the fake is more permissive than the real
 * adapter and the write-path tests go green over flows that 422 in production
 * (Spec 14 AC-11).
 */
function assertBackendUpdateContract(patch: UpdateCertificationCommand, row: Row): void {
  // `name`/`status`/`category` are non-nullable server-side. Read them untyped:
  // the port already forbids null, and the point here is to catch a caller that
  // sends one anyway.
  const raw = patch as Record<string, unknown>
  if (raw.status === null) throw new Error('status cannot be null')
  if (raw.name === null) throw new Error('name cannot be null')
  if (raw.categoryPath === null) throw new Error('category cannot be null')

  // BR-EV1: evidence — a value *or* an explicit null — is writable only while the
  // certification is, or becomes within this same patch, achieved. A key set to
  // `undefined` counts as absent, matching how the HTTP adapter builds the body.
  const resultingStatus = patch.status ?? row.status
  if (resultingStatus === 'achieved') return

  if (patch.evidenceUrl !== undefined) {
    const field = patch.evidenceUrlTarget === 'official' ? 'officialUrl' : 'credlyUrl'
    throw new Error(`${field} is writable only when the certification is achieved`)
  }
  if (patch.achievedDate !== undefined) {
    throw new Error('achievedDate is writable only when the certification is achieved')
  }
}

function toPublic(row: Row): Certification {
  const { _deleted: _, ...cert } = row
  return cert
}

type CategoryRow = CertificationCategory

export class InMemoryCertificationAdapter implements ICertificationJourneyService {
  private rows: Row[]
  private categories: CategoryRow[]

  constructor(seed: Certification[] = [], seedCategories: Array<{ path: string; color: string }> = []) {
    this.rows = seed.map(c => ({ ...c, _deleted: false }))

    // A category referenced by a seeded certification is implicitly a known
    // category too, so form/timeline fixtures that only seed certifications
    // keep working without a second, redundant seeding step.
    this.categories = []
    for (const c of seed) {
      if (c.category && !this.categories.some(cat => cat.id === c.category!.id)) {
        this.categories.push({ ...c.category })
      }
    }
    for (const sc of seedCategories) {
      const normalizedPath = normalizePath(sc.path)
      if (!this.categories.some(cat => cat.normalizedPath === normalizedPath)) {
        this.categories.push({ id: crypto.randomUUID(), path: sc.path, normalizedPath, color: sc.color })
      }
    }
  }

  private resolveCategory(path: string): CertificationCategory {
    const normalized = normalizePath(path)
    const found = this.categories.find(c => c.normalizedPath === normalized)
    if (!found) throw new Error('category does not exist — create it first')
    return { ...found }
  }

  private countFor(categoryId: string): number {
    return this.rows.filter(r => !r._deleted && r.category?.id === categoryId).length
  }

  async list(query: ListQuery = {}): Promise<CertificationPage> {
    let filtered = this.rows.filter(r => !r._deleted)

    if (query.search) {
      const lc = query.search.toLowerCase()
      filtered = filtered.filter(r => r.name.toLowerCase().includes(lc))
    }
    if (query.status) {
      filtered = filtered.filter(r => r.status === query.status)
    }
    if (query.categoryPrefix) {
      const prefix = normalizePath(query.categoryPrefix)
      filtered = filtered.filter(r => {
        const np = r.category?.normalizedPath
        return np === prefix || np?.startsWith(`${prefix}/`) || false
      })
    }
    if (query.year) {
      filtered = filtered.filter(r => intersectsYear(r, query.year!))
    }

    const sortBy = query.sortBy ?? 'createdAt'
    const sortOrder = query.sortOrder ?? 'asc'
    const sorted = [...filtered].sort((a, b) => {
      const av = ((a as unknown) as Record<string, unknown>)[sortBy] as string ?? ''
      const bv = ((b as unknown) as Record<string, unknown>)[sortBy] as string ?? ''
      const cmp = av.localeCompare(bv)
      return sortOrder === 'asc' ? cmp : -cmp
    })

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const totalItems = sorted.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const items = sorted.slice((page - 1) * pageSize, page * pageSize).map(toPublic)

    return { items, meta: { page, pageSize, totalItems, totalPages } }
  }

  async getById(id: string): Promise<Certification | null> {
    const row = this.rows.find(r => r.id === id && !r._deleted)
    return row ? toPublic(row) : null
  }

  async create(cmd: CreateCertificationCommand): Promise<Certification> {
    const now = new Date().toISOString()
    const row: Row = {
      id: crypto.randomUUID(),
      name: cmd.name,
      status: cmd.status ?? 'planned',
      category: cmd.categoryPath ? this.resolveCategory(cmd.categoryPath) : undefined,
      studyStartDate: cmd.studyStartDate,
      expectedExamDate: cmd.expectedExamDate,
      achievedDate: cmd.achievedDate,
      notes: cmd.notes,
      evidenceUrl: cmd.evidenceUrl,
      attachments: [],
      createdAt: now,
      updatedAt: now,
      _deleted: false,
    }
    this.rows.push(row)
    return toPublic(row)
  }

  async update(id: string, patch: UpdateCertificationCommand): Promise<Certification> {
    const row = this.rows.find(r => r.id === id && !r._deleted)
    if (!row) throw new Error('Certification not found')

    assertBackendUpdateContract(patch, row)

    if (patch.name !== undefined) row.name = patch.name
    if (patch.status !== undefined) {
      row.status = patch.status
      // The backend stamps the clock's civil date when a certification becomes
      // achieved with no date on record; an explicit achievedDate below wins.
      if (patch.status === 'achieved' && !row.achievedDate) {
        row.achievedDate = new Date().toISOString().slice(0, 10)
      }
    }
    if (patch.categoryPath != null) row.category = this.resolveCategory(patch.categoryPath)
    if (patch.studyStartDate !== undefined) row.studyStartDate = patch.studyStartDate ?? undefined
    if (patch.expectedExamDate !== undefined) {
      row.expectedExamDate = patch.expectedExamDate ?? undefined
    }
    if (patch.achievedDate !== undefined) row.achievedDate = patch.achievedDate ?? undefined
    if (patch.notes !== undefined) row.notes = patch.notes ?? undefined
    if (patch.evidenceUrl !== undefined) row.evidenceUrl = patch.evidenceUrl ?? undefined
    row.updatedAt = new Date().toISOString()

    return toPublic(row)
  }

  async remove(id: string): Promise<void> {
    const row = this.rows.find(r => r.id === id && !r._deleted)
    if (!row) throw new Error('Certification not found')
    row._deleted = true
  }

  async uploadAttachment(certId: string, kind: AttachmentKind, file: File): Promise<AttachmentMeta> {
    const row = this.rows.find(r => r.id === certId && !r._deleted)
    if (!row) throw new Error('Certification not found')
    const meta: AttachmentMeta = {
      id: crypto.randomUUID(),
      kind,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    }
    row.attachments = row.attachments.filter(a => a.kind !== kind)
    row.attachments.push(meta)
    return meta
  }

  attachmentUrl(attachmentId: string): string {
    return `/api/v1/attachments/${attachmentId}`
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    for (const row of this.rows) {
      const idx = row.attachments.findIndex(a => a.id === attachmentId)
      if (idx !== -1) {
        row.attachments.splice(idx, 1)
        return
      }
    }
    throw new Error('Attachment not found')
  }

  async listCategories(): Promise<Category[]> {
    return this.categories
      .map(cat => ({ ...cat, count: this.countFor(cat.id) }))
      .sort((a, b) => a.normalizedPath.localeCompare(b.normalizedPath))
  }

  async createCategory(cmd: CreateCategoryCommand): Promise<Category> {
    assertValidColor(cmd.color)
    const normalizedPath = normalizePath(cmd.path)
    if (this.categories.some(c => c.normalizedPath === normalizedPath)) {
      throw new Error('a category with this path already exists')
    }
    const row: CategoryRow = { id: crypto.randomUUID(), path: cmd.path, normalizedPath, color: cmd.color }
    this.categories.push(row)
    return { ...row, count: 0 }
  }

  async updateCategory(id: string, patch: UpdateCategoryCommand): Promise<Category> {
    const cat = this.categories.find(c => c.id === id)
    if (!cat) throw new Error('Category not found')

    if (patch.color !== undefined) assertValidColor(patch.color)
    if (patch.path !== undefined) {
      const normalizedPath = normalizePath(patch.path)
      if (normalizedPath !== cat.normalizedPath && this.categories.some(c => c.id !== id && c.normalizedPath === normalizedPath)) {
        throw new Error('a category with this path already exists')
      }
      cat.path = patch.path
      cat.normalizedPath = normalizedPath
    }
    if (patch.color !== undefined) cat.color = patch.color

    // Mirrors the real backend's join-at-read behavior: certifications
    // reference a category by id, so a rename/recolor is visible immediately
    // with no data migration.
    for (const row of this.rows) {
      if (row.category?.id === id) row.category = { ...cat }
    }

    return { ...cat, count: this.countFor(id) }
  }

  async deleteCategory(id: string): Promise<void> {
    const cat = this.categories.find(c => c.id === id)
    if (!cat) throw new Error('Category not found')
    const count = this.countFor(id)
    if (count > 0) throw new Error(`category is used by ${count} certification(s)`)
    this.categories = this.categories.filter(c => c.id !== id)
  }
}
