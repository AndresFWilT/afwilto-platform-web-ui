import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FetchHttpClient, HttpError, type IHttpClient } from '@afwilto/http-client'

const BASE = 'http://localhost:9999'

function jsonResponse(body: unknown, init?: { status?: number; statusText?: string }) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('FetchHttpClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>
  let client: IHttpClient

  beforeEach(() => {
    fetchSpy = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ data: 'pong' })))
    vi.stubGlobal('fetch', fetchSpy)
    client = new FetchHttpClient(BASE)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GET issues method GET against baseUrl+path with JSON content type (AC-2)', async () => {
    const result = await client.get<{ data: string }>('/ping')

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE}/ping`, expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }))
    expect(result).toEqual({ data: 'pong' })
  })

  it('POST serializes the body with JSON.stringify (AC-3)', async () => {
    await client.post('/rbt/insert', { value: 7 })

    const [, init] = fetchSpy.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ value: 7 }))
  })

  it('PATCH serializes the body with JSON.stringify', async () => {
    await client.patch('/certifications/abc', { status: 'achieved' })

    const [, init] = fetchSpy.mock.calls[0]
    expect(init.method).toBe('PATCH')
    expect(init.body).toBe(JSON.stringify({ status: 'achieved' }))
  })

  it('PUT serializes the body with JSON.stringify (AC-3)', async () => {
    await client.put('/rbt/7', { value: 8 })

    const [, init] = fetchSpy.mock.calls[0]
    expect(init.method).toBe('PUT')
    expect(init.body).toBe(JSON.stringify({ value: 8 }))
  })

  it('GET and DELETE send no body (AC-3)', async () => {
    await client.get('/a')
    await client.delete('/b')

    expect(fetchSpy.mock.calls[0][1].body).toBeUndefined()
    expect(fetchSpy.mock.calls[1][1].body).toBeUndefined()
    expect(fetchSpy.mock.calls[1][1].method).toBe('DELETE')
  })

  it('custom headers override the JSON default and signal is forwarded (AC-4)', async () => {
    const controller = new AbortController()
    await client.get('/auth', {
      headers: { 'Content-Type': 'text/plain', Authorization: 'Bearer t' },
      signal: controller.signal,
    })

    const [, init] = fetchSpy.mock.calls[0]
    expect(init.headers).toEqual({
      'Content-Type': 'text/plain',
      Authorization: 'Bearer t',
    })
    expect(init.signal).toBe(controller.signal)
  })

  it('non-ok response throws HttpError with status, statusText, and body (AC-5)', async () => {
    fetchSpy.mockImplementation(() =>
      Promise.resolve(jsonResponse({ error: 'nope' }, { status: 422, statusText: 'Unprocessable Entity' }))
    )

    const err = await client.get('/boom').catch(e => e) as HttpError
    expect(err).toBeInstanceOf(HttpError)
    expect(err.message).toBe('HTTP 422: Unprocessable Entity')
    expect(err.status).toBe(422)
    expect(err.body).toEqual({ error: 'nope' })
  })

  it('500 error throws HttpError (AC-5)', async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse({ error: 'internal' }, { status: 500, statusText: 'Internal Server Error' })
    )

    await expect(client.get('/boom')).rejects.toThrow('HTTP 500: Internal Server Error')
  })

  it('network failure propagates the fetch rejection (AC-5)', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(client.get('/down')).rejects.toThrow('Failed to fetch')
  })

  it('delete returns undefined for 204 No Content', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 204, statusText: 'No Content' }))

    const result = await client.delete('/certifications/abc')
    expect(result).toBeUndefined()
  })

  describe('postMultipart', () => {
    it('sends POST with FormData body and no Content-Type override', async () => {
      const form = new FormData()
      form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'file.txt')
      await client.postMultipart('/upload', form)

      const [url, init] = fetchSpy.mock.calls[0]
      expect(url).toBe(`${BASE}/upload`)
      expect(init.method).toBe('POST')
      expect(init.body).toBe(form)
      expect(init.headers['Content-Type']).toBeUndefined()
    })

    it('throws HttpError on non-ok response', async () => {
      fetchSpy.mockResolvedValue(
        jsonResponse({ error: 'too large' }, { status: 413, statusText: 'Content Too Large' })
      )
      const form = new FormData()
      await expect(client.postMultipart('/upload', form)).rejects.toBeInstanceOf(HttpError)
    })
  })
})
