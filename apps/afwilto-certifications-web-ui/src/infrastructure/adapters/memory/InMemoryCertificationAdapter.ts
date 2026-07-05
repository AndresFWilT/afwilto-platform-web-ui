import type {
  ICertificationJourneyService,
  Certification,
  CertificationCategory,
  CertificationPage,
  CategoryInUse,
  ListQuery,
  CreateCertificationCommand,
  UpdateCertificationCommand,
} from '@/application/ports'

function normalizePath(raw: string): string {
  return raw
    .split('/')
    .map(s => s.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('/')
}

function buildCategory(path: string): CertificationCategory {
  return {
    id: crypto.randomUUID(),
    path,
    normalizedPath: normalizePath(path),
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

function toPublic(row: Row): Certification {
  const { _deleted: _, ...cert } = row
  return cert
}

export class InMemoryCertificationAdapter implements ICertificationJourneyService {
  private rows: Row[]

  constructor(seed: Certification[] = []) {
    this.rows = seed.map(c => ({ ...c, _deleted: false }))
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
      category: cmd.categoryPath ? buildCategory(cmd.categoryPath) : undefined,
      studyStartDate: cmd.studyStartDate,
      expectedExamDate: cmd.expectedExamDate,
      achievedDate: cmd.achievedDate,
      notes: cmd.notes,
      evidenceUrl: cmd.evidenceUrl,
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

    if (patch.name !== undefined) row.name = patch.name
    if (patch.status !== undefined) row.status = patch.status
    if ('categoryPath' in patch) {
      row.category = patch.categoryPath != null ? buildCategory(patch.categoryPath) : undefined
    }
    if ('studyStartDate' in patch) row.studyStartDate = patch.studyStartDate ?? undefined
    if ('expectedExamDate' in patch) row.expectedExamDate = patch.expectedExamDate ?? undefined
    if ('achievedDate' in patch) row.achievedDate = patch.achievedDate ?? undefined
    if ('notes' in patch) row.notes = patch.notes ?? undefined
    if ('evidenceUrl' in patch) row.evidenceUrl = patch.evidenceUrl ?? undefined
    row.updatedAt = new Date().toISOString()

    return toPublic(row)
  }

  async remove(id: string): Promise<void> {
    const row = this.rows.find(r => r.id === id && !r._deleted)
    if (!row) throw new Error('Certification not found')
    row._deleted = true
  }

  async listCategories(): Promise<CategoryInUse[]> {
    const counts = new Map<string, CategoryInUse>()
    for (const row of this.rows.filter(r => !r._deleted && r.category)) {
      const np = row.category!.normalizedPath
      const existing = counts.get(np)
      if (existing) {
        existing.count++
      } else {
        counts.set(np, { ...row.category!, count: 1 })
      }
    }
    return Array.from(counts.values()).sort((a, b) =>
      a.normalizedPath.localeCompare(b.normalizedPath)
    )
  }
}
