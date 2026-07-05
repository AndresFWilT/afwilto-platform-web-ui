import { HttpError } from '@afwilto/http-client'
import type { IHttpClient } from '@afwilto/http-client'
import type {
  ICertificationJourneyService,
  Certification,
  CertificationPage,
  CategoryInUse,
  ListMeta,
  ListQuery,
  CreateCertificationCommand,
  UpdateCertificationCommand,
} from '@/application/ports'

interface ApiEnvelope<T> {
  data: T
}

interface ApiListEnvelope<T> {
  data: T[]
  meta: ListMeta
}

interface ErrorBody {
  error?: string
  detail?: string
  violations?: Array<{ field: string; message: string }>
}

function translateError(e: unknown): Error {
  if (e instanceof HttpError) {
    const body = e.body as ErrorBody | null
    if (body?.violations?.length) {
      return new Error(body.violations.map(v => v.message).join('; '))
    }
    if (body?.detail) return new Error(body.detail)
    if (body?.error) return new Error(body.error)
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
  if (query.categoryPrefix) params.set('categoryPrefix', query.categoryPrefix)
  if (query.year !== undefined) params.set('year', String(query.year))
  if (query.sortBy) params.set('sortBy', query.sortBy)
  if (query.sortOrder) params.set('sortOrder', query.sortOrder)
  const s = params.toString()
  return s ? `?${s}` : ''
}

export class CertificationHttpAdapter implements ICertificationJourneyService {
  private readonly http: IHttpClient

  constructor(http: IHttpClient) {
    this.http = http
  }

  async list(query?: ListQuery): Promise<CertificationPage> {
    const qs = buildQueryString(query)
    const envelope = await this.http.get<ApiListEnvelope<Certification>>(`/certifications${qs}`)
    return { items: envelope.data, meta: envelope.meta }
  }

  async getById(id: string): Promise<Certification | null> {
    try {
      const envelope = await this.http.get<ApiEnvelope<Certification>>(`/certifications/${id}`)
      return envelope.data
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) return null
      throw translateError(e)
    }
  }

  async create(cmd: CreateCertificationCommand): Promise<Certification> {
    try {
      const envelope = await this.http.post<ApiEnvelope<Certification>>('/certifications', cmd)
      return envelope.data
    } catch (e) {
      throw translateError(e)
    }
  }

  async update(id: string, patch: UpdateCertificationCommand): Promise<Certification> {
    try {
      const envelope = await this.http.patch<ApiEnvelope<Certification>>(`/certifications/${id}`, patch)
      return envelope.data
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

  async listCategories(): Promise<CategoryInUse[]> {
    const envelope = await this.http.get<ApiEnvelope<CategoryInUse[]>>('/categories')
    return envelope.data
  }
}
