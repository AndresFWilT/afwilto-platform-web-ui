import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpError } from '@afwilto/http-client'
import type { IHttpClient } from '@afwilto/http-client'
import { CertificationHttpAdapter } from '../src/infrastructure/adapters/http/CertificationHttpAdapter'

const NOW = '2026-07-05T00:00:00.000Z'
const BASE = 'http://localhost:8082/api/v1'

// Backend wire shape (§8.3): category is an object, motivation is `goal`,
// evidence is `credlyUrl`/`officialUrl`, optional fields are null.
function wireCert(overrides?: Record<string, unknown>) {
  return {
    id: 'cert-1',
    name: 'AWS SAA',
    category: { id: 'cat-1', path: 'TI / Cloud', color: '#22D3EE' },
    status: 'planned',
    studyStartDate: null,
    expectedExamDate: null,
    goal: null,
    achievedDate: null,
    credlyUrl: null,
    officialUrl: null,
    attachments: [],
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
    adapter = new CertificationHttpAdapter(http, BASE)
  })

  // ── list ──────────────────────────────────────────────────────────────────

  it('list calls GET /certifications with no query string when no query provided', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [wireCert()], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } })
    const result = await adapter.list()
    expect(http.get).toHaveBeenCalledWith('/certifications')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('cert-1')
  })

  it('list maps frontend query fields to the backend param names', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [], meta: { page: 2, pageSize: 10, totalItems: 0, totalPages: 1 } })
    await adapter.list({
      page: 2,
      pageSize: 10,
      search: 'aws',
      status: 'achieved',
      categoryPrefix: 'TI / Cloud',
      year: 2025,
      sortBy: 'name',
      sortOrder: 'desc',
    })
    const [url] = vi.mocked(http.get).mock.calls[0]
    expect(url).toContain('page=2')
    expect(url).toContain('pageSize=10')
    expect(url).toContain('search=aws')
    expect(url).toContain('status=achieved')
    // categoryPrefix → category, sortBy → sort, sortOrder → order
    expect(url).toMatch(/category=TI(\+|%20|%2520)/)
    expect(url).toContain('sort=name')
    expect(url).toContain('order=desc')
    expect(url).not.toContain('categoryPrefix')
    expect(url).not.toContain('sortBy')
    expect(url).not.toContain('sortOrder')
    expect(url).toContain('year=2025')
    expect(url).toMatch(/^\/certifications\?/)
  })

  it('list maps wire fields (goal→notes, credlyUrl→evidenceUrl) and derives normalizedPath', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: [wireCert({ goal: 'get promoted', credlyUrl: 'https://credly.com/x', category: { id: 'cat-1', path: 'TI / Cloud', color: '#22D3EE' } })],
      meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    })
    const { items } = await adapter.list()
    expect(items[0].notes).toBe('get promoted')
    expect(items[0].evidenceUrl).toBe('https://credly.com/x')
    expect(items[0].category?.path).toBe('TI / Cloud')
    expect(items[0].category?.normalizedPath).toBe('ti/cloud')
    expect(items[0].category?.color).toBe('#22D3EE')
  })

  // ── getById ───────────────────────────────────────────────────────────────

  it('getById maps the wire response into the domain shape', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: wireCert({ goal: 'motivation', officialUrl: 'https://aws.amazon.com/x' }) })
    const cert = await adapter.getById('cert-1')
    expect(http.get).toHaveBeenCalledWith('/certifications/cert-1')
    expect(cert?.notes).toBe('motivation')
    // credlyUrl is null but officialUrl present → evidenceUrl falls back to officialUrl
    expect(cert?.evidenceUrl).toBe('https://aws.amazon.com/x')
    // wire nulls become undefined in the domain
    expect(cert?.studyStartDate).toBeUndefined()
    expect(cert?.attachments).toEqual([])
  })

  it('getById returns null on 404', async () => {
    vi.mocked(http.get).mockRejectedValue(new HttpError(404, 'Not Found', { error: 'not found' }))
    expect(await adapter.getById('missing')).toBeNull()
  })

  it('getById re-throws other HttpErrors as human messages', async () => {
    vi.mocked(http.get).mockRejectedValue(new HttpError(500, 'Internal Server Error', { error: { code: 'internal', message: 'internal server error' } }))
    await expect(adapter.getById('x')).rejects.toThrow('internal server error')
  })

  // ── create ────────────────────────────────────────────────────────────────

  it('create maps categoryPath→category and notes→goal in the POST body', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: wireCert() })
    await adapter.create({ name: 'AWS SAA', categoryPath: 'TI / Cloud', notes: 'why' })
    expect(http.post).toHaveBeenCalledWith('/certifications', {
      name: 'AWS SAA',
      category: 'TI / Cloud',
      studyStartDate: undefined,
      expectedExamDate: undefined,
      goal: 'why',
    })
  })

  it('create does not leak frontend-only keys (categoryPath, notes, evidenceUrl) to the wire', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: wireCert() })
    await adapter.create({ name: 'X', categoryPath: 'A', notes: 'n' })
    const [, body] = vi.mocked(http.post).mock.calls[0]
    expect(body).not.toHaveProperty('categoryPath')
    expect(body).not.toHaveProperty('notes')
    expect(body).not.toHaveProperty('evidenceUrl')
  })

  it('create with achieved status/evidence follows up with a PATCH (backend create ignores them)', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: wireCert({ id: 'new-1' }) })
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert({ id: 'new-1', status: 'achieved', achievedDate: '2026-06-01', credlyUrl: 'https://credly.com/z' }) })
    const cert = await adapter.create({
      name: 'CKA',
      categoryPath: 'DevOps',
      status: 'achieved',
      achievedDate: '2026-06-01',
      evidenceUrl: 'https://credly.com/z',
    })
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.patch).toHaveBeenCalledWith('/certifications/new-1', expect.objectContaining({
      status: 'achieved',
      achievedDate: '2026-06-01',
      credlyUrl: 'https://credly.com/z',
    }))
    expect(cert.status).toBe('achieved')
  })

  it('create translates validation error (422) body to message', async () => {
    vi.mocked(http.post).mockRejectedValue(
      new HttpError(422, 'Unprocessable Entity', {
        error: { code: 'validation_failed', message: 'validation failed', details: [{ field: 'name', rule: 'required', message: 'name is required' }] },
      })
    )
    await expect(adapter.create({ name: '' })).rejects.toThrow('name is required')
  })

  // ── update ────────────────────────────────────────────────────────────────

  it('update maps notes→goal, categoryPath→category, evidenceUrl→credlyUrl', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert({ status: 'achieved' }) })
    await adapter.update('cert-1', { status: 'achieved', notes: 'done', categoryPath: 'TI / Cloud', evidenceUrl: 'https://credly.com/y' })
    expect(http.patch).toHaveBeenCalledWith('/certifications/cert-1', {
      status: 'achieved',
      goal: 'done',
      category: 'TI / Cloud',
      credlyUrl: 'https://credly.com/y',
    })
  })

  it('update forwards explicit nulls (clear) for goal/category/evidence', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert() })
    await adapter.update('cert-1', { notes: null, categoryPath: null, evidenceUrl: null })
    expect(http.patch).toHaveBeenCalledWith('/certifications/cert-1', {
      goal: null,
      category: null,
      credlyUrl: null,
      officialUrl: null,
    })
  })

  it('update ignores keys explicitly set to undefined (absent, not a clear)', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert() })
    await adapter.update('cert-1', {
      status: 'in_progress',
      achievedDate: undefined,
      evidenceUrl: undefined,
      notes: undefined,
    })
    expect(http.patch).toHaveBeenCalledWith('/certifications/cert-1', { status: 'in_progress' })
  })

  it('update omits every key the patch did not set (merge-patch, Spec 14 AC-2)', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert() })
    await adapter.update('cert-1', { expectedExamDate: '2027-03-01' })
    expect(http.patch).toHaveBeenCalledWith('/certifications/cert-1', {
      expectedExamDate: '2027-03-01',
    })
  })

  // ── evidence write target (Spec 14 BR-EVT1 / AC-8) ───────────────────────────

  it('getById reports evidenceUrlSource = official when only officialUrl is set', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: wireCert({ credlyUrl: null, officialUrl: 'https://aws.amazon.com/a' }),
    })
    const cert = await adapter.getById('cert-1')
    expect(cert?.evidenceUrl).toBe('https://aws.amazon.com/a')
    expect(cert?.evidenceUrlSource).toBe('official')
  })

  it('getById reports evidenceUrlSource = credly when credlyUrl is set', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: wireCert({ credlyUrl: 'https://credly.com/a', officialUrl: 'https://aws.amazon.com/a' }),
    })
    const cert = await adapter.getById('cert-1')
    expect(cert?.evidenceUrl).toBe('https://credly.com/a')
    expect(cert?.evidenceUrlSource).toBe('credly')
  })

  it('getById leaves evidenceUrlSource undefined when there is no evidence URL', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: wireCert() })
    const cert = await adapter.getById('cert-1')
    expect(cert?.evidenceUrlSource).toBeUndefined()
  })

  it('update writes evidenceUrl to officialUrl when the target is official', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert() })
    await adapter.update('cert-1', {
      evidenceUrl: 'https://aws.amazon.com/b',
      evidenceUrlTarget: 'official',
    })
    expect(http.patch).toHaveBeenCalledWith('/certifications/cert-1', {
      officialUrl: 'https://aws.amazon.com/b',
    })
  })

  // The UI exposes ONE evidence URL field, so "clear" must mean "no evidence URL
  // at all" — clearing only the target would resurrect the other wire field on
  // a row that has both (Spec 14 BR-EVT2).
  it('clearing the evidence URL clears both wire fields, whatever the target', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert() })
    await adapter.update('cert-1', { evidenceUrl: null, evidenceUrlTarget: 'official' })
    expect(http.patch).toHaveBeenCalledWith('/certifications/cert-1', {
      credlyUrl: null,
      officialUrl: null,
    })
  })

  it('setting an evidence URL writes only the target field', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert() })
    await adapter.update('cert-1', {
      evidenceUrl: 'https://aws.amazon.com/b',
      evidenceUrlTarget: 'official',
    })
    const [, body] = vi.mocked(http.patch).mock.calls[0]
    expect(body).toEqual({ officialUrl: 'https://aws.amazon.com/b' })
    expect(body).not.toHaveProperty('credlyUrl')
  })

  it('update defaults the evidence target to credlyUrl and never leaks evidenceUrlTarget', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert() })
    await adapter.update('cert-1', { evidenceUrl: 'https://credly.com/b' })
    const [, body] = vi.mocked(http.patch).mock.calls[0]
    expect(body).toEqual({ credlyUrl: 'https://credly.com/b' })
    expect(body).not.toHaveProperty('evidenceUrlTarget')
  })

  it('update ignores evidenceUrlTarget when evidenceUrl was not patched', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: wireCert() })
    await adapter.update('cert-1', { name: 'CKA', evidenceUrlTarget: 'official' })
    expect(http.patch).toHaveBeenCalledWith('/certifications/cert-1', { name: 'CKA' })
  })

  // ── remove ────────────────────────────────────────────────────────────────

  it('remove sends DELETE to /certifications/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await adapter.remove('cert-1')
    expect(http.delete).toHaveBeenCalledWith('/certifications/cert-1')
  })

  it('remove re-throws non-404 errors', async () => {
    vi.mocked(http.delete).mockRejectedValue(new HttpError(403, 'Forbidden', { error: { code: 'forbidden', message: 'forbidden' } }))
    await expect(adapter.remove('cert-1')).rejects.toThrow('forbidden')
  })

  // ── listCategories ────────────────────────────────────────────────────────

  it('listCategories calls GET /categories and maps to domain (derives normalizedPath)', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [{ id: '1', path: 'TI / Cloud', color: '#22D3EE', count: 3 }] })
    const result = await adapter.listCategories()
    expect(http.get).toHaveBeenCalledWith('/categories')
    expect(result).toEqual([{ id: '1', path: 'TI / Cloud', normalizedPath: 'ti/cloud', color: '#22D3EE', count: 3 }])
  })

  it('listCategories includes categories with count 0 (unused)', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [{ id: '1', path: 'Unused', color: '#A78BFA', count: 0 }] })
    const result = await adapter.listCategories()
    expect(result[0].count).toBe(0)
  })

  // ── createCategory / updateCategory / deleteCategory ────────────────────────

  it('createCategory posts path/color and maps the created category (count 0)', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: { id: '1', path: 'Cloud / AWS', color: '#22D3EE', count: 0 } })
    const result = await adapter.createCategory({ path: 'Cloud / AWS', color: '#22D3EE' })
    expect(http.post).toHaveBeenCalledWith('/categories', { path: 'Cloud / AWS', color: '#22D3EE' })
    expect(result).toEqual({ id: '1', path: 'Cloud / AWS', normalizedPath: 'cloud/aws', color: '#22D3EE', count: 0 })
  })

  it('createCategory translates a duplicate-path 422 to a plain error (backend AC-2)', async () => {
    vi.mocked(http.post).mockRejectedValue(
      new HttpError(422, 'Unprocessable Entity', {
        error: { code: 'validation_failed', message: 'validation failed', details: [{ field: 'path', rule: 'unique', message: 'a category with this path already exists' }] },
      })
    )
    await expect(adapter.createCategory({ path: 'Cloud', color: '#22D3EE' })).rejects.toThrow(
      'a category with this path already exists'
    )
  })

  it('createCategory translates a bad-color 422 to a plain error (backend AC-3)', async () => {
    vi.mocked(http.post).mockRejectedValue(
      new HttpError(422, 'Unprocessable Entity', {
        error: { code: 'validation_failed', message: 'validation failed', details: [{ field: 'color', rule: 'format', message: 'color must be a 6-digit hex value like #22D3EE' }] },
      })
    )
    await expect(adapter.createCategory({ path: 'Cloud', color: 'blue' })).rejects.toThrow(
      'color must be a 6-digit hex value like #22D3EE'
    )
  })

  it('updateCategory patches only the provided fields', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: { id: '1', path: 'Cloud', color: '#34D399', count: 2 } })
    const result = await adapter.updateCategory('1', { color: '#34D399' })
    expect(http.patch).toHaveBeenCalledWith('/categories/1', { color: '#34D399' })
    expect(result.color).toBe('#34D399')
  })

  it('updateCategory translates a rename-collision 422 to a plain error (backend AC-8)', async () => {
    vi.mocked(http.patch).mockRejectedValue(
      new HttpError(422, 'Unprocessable Entity', {
        error: { code: 'validation_failed', message: 'validation failed', details: [{ field: 'path', rule: 'unique', message: 'a category with this path already exists' }] },
      })
    )
    await expect(adapter.updateCategory('1', { path: 'Cloud' })).rejects.toThrow(
      'a category with this path already exists'
    )
  })

  it('updateCategory translates a 404 to a plain error (backend AC-9)', async () => {
    vi.mocked(http.patch).mockRejectedValue(new HttpError(404, 'Not Found', { error: { code: 'not_found', message: 'resource not found' } }))
    await expect(adapter.updateCategory('missing', { color: '#22D3EE' })).rejects.toThrow('resource not found')
  })

  it('deleteCategory sends DELETE to /categories/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await adapter.deleteCategory('1')
    expect(http.delete).toHaveBeenCalledWith('/categories/1')
  })

  it('deleteCategory translates an in-use 422 to a plain error verbatim (backend AC-11)', async () => {
    vi.mocked(http.delete).mockRejectedValue(
      new HttpError(422, 'Unprocessable Entity', {
        error: { code: 'validation_failed', message: 'validation failed', details: [{ field: 'category', rule: 'in_use', message: 'category is used by 3 certification(s)' }] },
      })
    )
    await expect(adapter.deleteCategory('1')).rejects.toThrow('category is used by 3 certification(s)')
  })

  it('deleteCategory translates a 404 to a plain error (backend AC-12)', async () => {
    vi.mocked(http.delete).mockRejectedValue(new HttpError(404, 'Not Found', { error: { code: 'not_found', message: 'resource not found' } }))
    await expect(adapter.deleteCategory('missing')).rejects.toThrow('resource not found')
  })

  // ── attachments ─────────────────────────────────────────────────────────────

  it('attachmentUrl returns an absolute URL against the API base', () => {
    expect(adapter.attachmentUrl('att-1')).toBe('http://localhost:8082/api/v1/attachments/att-1')
  })

  it('uploadAttachment posts multipart form with kind + file', async () => {
    vi.mocked(http.postMultipart).mockResolvedValue({ data: { id: 'att-1', kind: 'certificate', fileName: 'c.pdf', contentType: 'application/pdf', sizeBytes: 10 } })
    const file = new File(['x'], 'c.pdf', { type: 'application/pdf' })
    const meta = await adapter.uploadAttachment('cert-1', 'certificate', file)
    const [url, form] = vi.mocked(http.postMultipart).mock.calls[0]
    expect(url).toBe('/certifications/cert-1/attachments')
    expect(form).toBeInstanceOf(FormData)
    expect((form as FormData).get('kind')).toBe('certificate')
    expect(meta.id).toBe('att-1')
  })

  it('removeAttachment sends DELETE to /attachments/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await adapter.removeAttachment('att-1')
    expect(http.delete).toHaveBeenCalledWith('/attachments/att-1')
  })
})
