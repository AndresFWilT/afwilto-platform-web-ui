import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpError } from '@afwilto/http-client'
import type { IHttpClient } from '@afwilto/http-client'
import { CertificationHttpAdapter } from '../src/infrastructure/adapters/http/CertificationHttpAdapter'
import type { Certification } from '../src/application/ports'

const NOW = '2026-07-05T00:00:00.000Z'

function makeCert(overrides?: Partial<Certification>): Certification {
  return {
    id: 'cert-1',
    name: 'AWS SAA',
    status: 'planned',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

function makeHttpClient(overrides?: Partial<IHttpClient>): IHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    postMultipart: vi.fn(),
    ...overrides,
  }
}

describe('CertificationHttpAdapter', () => {
  let http: IHttpClient
  let adapter: CertificationHttpAdapter

  beforeEach(() => {
    http = makeHttpClient()
    adapter = new CertificationHttpAdapter(http)
  })

  // ── list ──────────────────────────────────────────────────────────────────

  it('list calls GET /certifications with no query string when no query provided', async () => {
    const cert = makeCert()
    vi.mocked(http.get).mockResolvedValue({ data: [cert], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } })
    const result = await adapter.list()
    expect(http.get).toHaveBeenCalledWith('/certifications')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('cert-1')
  })

  it('list builds correct query string from all filter fields', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [], meta: { page: 2, pageSize: 10, totalItems: 0, totalPages: 1 } })
    await adapter.list({
      page: 2,
      pageSize: 10,
      search: 'aws',
      status: 'achieved',
      categoryPrefix: 'Cloud',
      year: 2025,
      sortBy: 'name',
      sortOrder: 'desc',
    })
    const [url] = vi.mocked(http.get).mock.calls[0]
    expect(url).toContain('page=2')
    expect(url).toContain('pageSize=10')
    expect(url).toContain('search=aws')
    expect(url).toContain('status=achieved')
    expect(url).toContain('categoryPrefix=Cloud')
    expect(url).toContain('year=2025')
    expect(url).toContain('sortBy=name')
    expect(url).toContain('sortOrder=desc')
    expect(url).toMatch(/^\/certifications\?/)
  })

  it('list unwraps data and meta envelope', async () => {
    const meta = { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 }
    vi.mocked(http.get).mockResolvedValue({ data: [makeCert(), makeCert({ id: 'cert-2', name: 'CKA' })], meta })
    const result = await adapter.list()
    expect(result.meta).toEqual(meta)
    expect(result.items).toHaveLength(2)
  })

  // ── getById ───────────────────────────────────────────────────────────────

  it('getById returns the certification on success', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: makeCert() })
    const cert = await adapter.getById('cert-1')
    expect(http.get).toHaveBeenCalledWith('/certifications/cert-1')
    expect(cert?.id).toBe('cert-1')
  })

  it('getById returns null on 404', async () => {
    vi.mocked(http.get).mockRejectedValue(new HttpError(404, 'Not Found', { error: 'not found' }))
    expect(await adapter.getById('missing')).toBeNull()
  })

  it('getById re-throws other HttpErrors as human messages', async () => {
    vi.mocked(http.get).mockRejectedValue(new HttpError(500, 'Internal Server Error', { error: 'internal server error' }))
    await expect(adapter.getById('x')).rejects.toThrow('internal server error')
  })

  // ── create ────────────────────────────────────────────────────────────────

  it('create calls POST /certifications and unwraps data', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: makeCert() })
    const cert = await adapter.create({ name: 'AWS SAA' })
    expect(http.post).toHaveBeenCalledWith('/certifications', { name: 'AWS SAA' })
    expect(cert.id).toBe('cert-1')
  })

  it('create translates validation error (422) body to message', async () => {
    vi.mocked(http.post).mockRejectedValue(
      new HttpError(422, 'Unprocessable Entity', {
        error: 'validation',
        violations: [{ field: 'name', message: 'name is required' }],
      })
    )
    await expect(adapter.create({ name: '' })).rejects.toThrow('name is required')
  })

  // ── update ────────────────────────────────────────────────────────────────

  it('update sends PATCH to /certifications/:id', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: makeCert({ status: 'achieved' }) })
    const cert = await adapter.update('cert-1', { status: 'achieved' })
    expect(http.patch).toHaveBeenCalledWith('/certifications/cert-1', { status: 'achieved' })
    expect(cert.status).toBe('achieved')
  })

  // ── remove ────────────────────────────────────────────────────────────────

  it('remove sends DELETE to /certifications/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await adapter.remove('cert-1')
    expect(http.delete).toHaveBeenCalledWith('/certifications/cert-1')
  })

  it('remove re-throws non-404 errors', async () => {
    vi.mocked(http.delete).mockRejectedValue(new HttpError(403, 'Forbidden', { error: 'forbidden' }))
    await expect(adapter.remove('cert-1')).rejects.toThrow('forbidden')
  })

  // ── listCategories ────────────────────────────────────────────────────────

  it('listCategories calls GET /categories and unwraps array', async () => {
    const cats = [{ id: '1', path: 'Cloud', normalizedPath: 'cloud', count: 3 }]
    vi.mocked(http.get).mockResolvedValue({ data: cats })
    const result = await adapter.listCategories()
    expect(http.get).toHaveBeenCalledWith('/categories')
    expect(result).toEqual(cats)
  })
})
