import { HttpError } from '@afwilto/http-client'
import type { IHttpClient } from '@afwilto/http-client'
import type {
  ICertificationJourneyService,
  Certification,
  CertificationCategory,
  CertificationPage,
  Category,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  ListMeta,
  ListQuery,
  CreateCertificationCommand,
  UpdateCertificationCommand,
  AttachmentKind,
  AttachmentMeta,
} from '@/application/ports'

// ── Wire shapes (backend §8.3 contract) ──────────────────────────────────────

interface WireCategory {
  id: string
  path: string
  color: string
  count?: number
}

interface WireCertification {
  id: string
  name: string
  category: WireCategory | null
  status: Certification['status']
  studyStartDate: string | null
  expectedExamDate: string | null
  goal: string | null
  achievedDate: string | null
  credlyUrl: string | null
  officialUrl: string | null
  attachments: AttachmentMeta[]
  createdAt: string
  updatedAt: string
}

interface ApiEnvelope<T> {
  data: T
}

interface ApiListEnvelope<T> {
  data: T[]
  meta: ListMeta
}

interface WireError {
  error?: { code?: string; message?: string; details?: Array<{ field: string; rule: string; message: string }> } | string
}

// ── Translation helpers ───────────────────────────────────────────────────────

function normalizePath(raw: string): string {
  return raw
    .split('/')
    .map(s => s.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('/')
}

function mapCategory(wire: WireCategory): CertificationCategory {
  return { id: wire.id, path: wire.path, normalizedPath: normalizePath(wire.path), color: wire.color }
}

function mapCertification(wire: WireCertification): Certification {
  return {
    id: wire.id,
    name: wire.name,
    status: wire.status,
    category: wire.category ? mapCategory(wire.category) : undefined,
    studyStartDate: wire.studyStartDate ?? undefined,
    expectedExamDate: wire.expectedExamDate ?? undefined,
    achievedDate: wire.achievedDate ?? undefined,
    notes: wire.goal ?? undefined,
    evidenceUrl: wire.credlyUrl ?? wire.officialUrl ?? undefined,
    // Remember which wire field the URL came from so an edit writes it back
    // there instead of forking a second evidence URL (BR-EVT1).
    evidenceUrlSource: wire.credlyUrl ? 'credly' : wire.officialUrl ? 'official' : undefined,
    attachments: wire.attachments ?? [],
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  }
}

function translateError(e: unknown): Error {
  if (e instanceof HttpError) {
    const body = e.body as WireError | null
    const err = body?.error
    if (err && typeof err === 'object') {
      if (Array.isArray(err.details) && err.details.length) {
        return new Error(err.details.map(d => d.message).join('; '))
      }
      if (err.message) return new Error(err.message)
    }
    if (typeof err === 'string') return new Error(err)
    return new Error(`Request failed (${e.status})`)
  }
  return e instanceof Error ? e : new Error(String(e))
}

function buildQueryString(query?: ListQuery): string {
  if (!query) return ''
  const params = new URLSearchParams()
  if (query.page !== undefined) params.set('page', String(query.page))
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize))
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.categoryPrefix) params.set('category', query.categoryPrefix)
  if (query.year !== undefined) params.set('year', String(query.year))
  if (query.sortBy) params.set('sort', query.sortBy)
  if (query.sortOrder) params.set('order', query.sortOrder)
  const s = params.toString()
  return s ? `?${s}` : ''
}

// Only keys the frontend actually set (undefined = leave untouched; null = clear).
function buildUpdateBody(patch: UpdateCertificationCommand): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (patch.name !== undefined) body.name = patch.name
  if (patch.status !== undefined) body.status = patch.status
  if (patch.categoryPath !== undefined) body.category = patch.categoryPath
  if (patch.studyStartDate !== undefined) body.studyStartDate = patch.studyStartDate
  if (patch.expectedExamDate !== undefined) body.expectedExamDate = patch.expectedExamDate
  if (patch.achievedDate !== undefined) body.achievedDate = patch.achievedDate
  if (patch.notes !== undefined) body.goal = patch.notes
  if (patch.evidenceUrl !== undefined) {
    if (patch.evidenceUrl === null) {
      // BR-EVT2: the UI exposes one evidence URL, so clearing it must clear both
      // wire fields — clearing only the target would resurface the other one.
      body.credlyUrl = null
      body.officialUrl = null
    } else {
      // BR-EVT1: write back to the field the URL was read from.
      body[patch.evidenceUrlTarget === 'official' ? 'officialUrl' : 'credlyUrl'] = patch.evidenceUrl
    }
  }
  return body
}

export class CertificationHttpAdapter implements ICertificationJourneyService {
  private readonly http: IHttpClient
  private readonly baseUrl: string

  constructor(http: IHttpClient, baseUrl = '') {
    this.http = http
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async list(query?: ListQuery): Promise<CertificationPage> {
    try {
      const qs = buildQueryString(query)
      const envelope = await this.http.get<ApiListEnvelope<WireCertification>>(`/certifications${qs}`)
      return { items: envelope.data.map(mapCertification), meta: envelope.meta }
    } catch (e) {
      throw translateError(e)
    }
  }

  async getById(id: string): Promise<Certification | null> {
    try {
      const envelope = await this.http.get<ApiEnvelope<WireCertification>>(`/certifications/${id}`)
      return mapCertification(envelope.data)
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) return null
      throw translateError(e)
    }
  }

  async create(cmd: CreateCertificationCommand): Promise<Certification> {
    try {
      const envelope = await this.http.post<ApiEnvelope<WireCertification>>('/certifications', {
        name: cmd.name,
        category: cmd.categoryPath ?? '',
        studyStartDate: cmd.studyStartDate,
        expectedExamDate: cmd.expectedExamDate,
        goal: cmd.notes,
      })
      const created = mapCertification(envelope.data)

      // The backend create ignores status/achievedDate/evidence — apply them via PATCH.
      const needsFollowUp =
        (cmd.status !== undefined && cmd.status !== 'planned') ||
        cmd.achievedDate !== undefined ||
        cmd.evidenceUrl !== undefined
      if (needsFollowUp) {
        return this.update(created.id, {
          status: cmd.status,
          achievedDate: cmd.achievedDate,
          evidenceUrl: cmd.evidenceUrl,
        })
      }
      return created
    } catch (e) {
      throw translateError(e)
    }
  }

  async update(id: string, patch: UpdateCertificationCommand): Promise<Certification> {
    try {
      const envelope = await this.http.patch<ApiEnvelope<WireCertification>>(
        `/certifications/${id}`,
        buildUpdateBody(patch),
      )
      return mapCertification(envelope.data)
    } catch (e) {
      throw translateError(e)
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.http.delete<void>(`/certifications/${id}`)
    } catch (e) {
      throw translateError(e)
    }
  }

  async listCategories(): Promise<Category[]> {
    try {
      const envelope = await this.http.get<ApiEnvelope<WireCategory[]>>('/categories')
      return envelope.data.map(c => ({ ...mapCategory(c), count: c.count ?? 0 }))
    } catch (e) {
      throw translateError(e)
    }
  }

  async createCategory(cmd: CreateCategoryCommand): Promise<Category> {
    try {
      const envelope = await this.http.post<ApiEnvelope<WireCategory>>('/categories', {
        path: cmd.path,
        color: cmd.color,
      })
      return { ...mapCategory(envelope.data), count: envelope.data.count ?? 0 }
    } catch (e) {
      throw translateError(e)
    }
  }

  async updateCategory(id: string, patch: UpdateCategoryCommand): Promise<Category> {
    try {
      const body: Record<string, unknown> = {}
      if (patch.path !== undefined) body.path = patch.path
      if (patch.color !== undefined) body.color = patch.color
      const envelope = await this.http.patch<ApiEnvelope<WireCategory>>(`/categories/${id}`, body)
      return { ...mapCategory(envelope.data), count: envelope.data.count ?? 0 }
    } catch (e) {
      throw translateError(e)
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await this.http.delete<void>(`/categories/${id}`)
    } catch (e) {
      throw translateError(e)
    }
  }

  async uploadAttachment(certId: string, kind: AttachmentKind, file: File): Promise<AttachmentMeta> {
    try {
      const form = new FormData()
      form.append('kind', kind)
      form.append('file', file)
      const envelope = await this.http.postMultipart<ApiEnvelope<AttachmentMeta>>(
        `/certifications/${certId}/attachments`,
        form,
      )
      return envelope.data
    } catch (e) {
      throw translateError(e)
    }
  }

  attachmentUrl(attachmentId: string): string {
    return `${this.baseUrl}/attachments/${attachmentId}`
  }

  async removeAttachment(attachmentId: string): Promise<void> {
    try {
      await this.http.delete<void>(`/attachments/${attachmentId}`)
    } catch (e) {
      throw translateError(e)
    }
  }
}
