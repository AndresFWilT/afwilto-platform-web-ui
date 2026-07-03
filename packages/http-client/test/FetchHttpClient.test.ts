import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FetchHttpClient, type IHttpClient } from '@afwilto/http-client'

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

  it('non-ok response throws Error("HTTP <status>: <statusText>") (AC-5)', async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse({ error: 'nope' }, { status: 500, statusText: 'Internal Server Error' })
    )

    await expect(client.get('/boom')).rejects.toThrow('HTTP 500: Internal Server Error')
  })

  it('network failure propagates the fetch rejection (AC-5)', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(client.get('/down')).rejects.toThrow('Failed to fetch')
  })
})
