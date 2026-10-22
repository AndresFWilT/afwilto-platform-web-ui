import { describe, it, expect, vi } from 'vitest'
import { HttpError, type IHttpClient } from '@afwilto/http-client'
import { CidrHttpAdapter } from '../src/cidr/infrastructure/http/CidrHttpAdapter'
import { CidrValidationError } from '../src/cidr/application/errors'
import { aggregation, ipv4Range, ipv6Table, summary } from './support/fixtures'

function httpClient(overrides: Partial<IHttpClient> = {}): IHttpClient {
  const unused = () => Promise.reject(new Error('not used'))
  return { get: unused, post: unused, patch: unused, put: unused, delete: unused, postMultipart: unused, ...overrides }
}

// Spec 17 AC-F10 — the adapter unwraps {data} and translates HTTP failures
// into domain errors; no HTTP type crosses the port.
describe('CidrHttpAdapter', () => {
  it('calculateRange posts the CIDR and unwraps data', async () => {
    const post = vi.fn(() => Promise.resolve({ data: ipv4Range }))
    const adapter = new CidrHttpAdapter(httpClient({ post: post as IHttpClient['post'] }))
    await expect(adapter.calculateRange('10.0.0.0/24')).resolves.toEqual(ipv4Range)
    expect(post).toHaveBeenCalledWith('/cidr/range', { cidr: '10.0.0.0/24' })
  })

  it('summarizeRange posts both bounds', async () => {
    const post = vi.fn(() => Promise.resolve({ data: summary }))
    const adapter = new CidrHttpAdapter(httpClient({ post: post as IHttpClient['post'] }))
    await expect(adapter.summarizeRange('192.168.1.10', '192.168.1.20')).resolves.toEqual(summary)
    expect(post).toHaveBeenCalledWith('/cidr/summarize', { firstIp: '192.168.1.10', lastIp: '192.168.1.20' })
  })

  it('aggregate posts the address list', async () => {
    const post = vi.fn(() => Promise.resolve({ data: aggregation }))
    const adapter = new CidrHttpAdapter(httpClient({ post: post as IHttpClient['post'] }))
    await expect(adapter.aggregate(['10.0.0.1'])).resolves.toEqual(aggregation)
    expect(post).toHaveBeenCalledWith('/cidr/aggregate', { addresses: ['10.0.0.1'] })
  })

  it('prefixTable gets the family table', async () => {
    const get = vi.fn(() => Promise.resolve({ data: ipv6Table }))
    const adapter = new CidrHttpAdapter(httpClient({ get: get as IHttpClient['get'] }))
    await expect(adapter.prefixTable('ipv6')).resolves.toEqual(ipv6Table)
    expect(get).toHaveBeenCalledWith('/cidr/prefix-table?family=ipv6')
  })

  it('turns a 422 into a CidrValidationError carrying the details', async () => {
    const details = [{ field: 'cidr', rule: 'format', message: 'cidr must be a CIDR such as 10.0.0.0/24' }]
    const post = () => Promise.reject(new HttpError(422, 'Unprocessable Entity', { error: { code: 'validation_failed', message: details[0].message, details } }))
    const adapter = new CidrHttpAdapter(httpClient({ post }))
    const error = await adapter.calculateRange('x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(CidrValidationError)
    expect((error as CidrValidationError).violations).toEqual(details)
    expect((error as CidrValidationError).messageFor('cidr')).toBe(details[0].message)
  })

  it('turns other API failures into an Error with the API message', async () => {
    const post = () => Promise.reject(new HttpError(500, 'Internal Server Error', { error: { code: 'internal', message: 'Internal server error' } }))
    const error = await new CidrHttpAdapter(httpClient({ post })).calculateRange('x').catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(HttpError)
    expect((error as Error).message).toBe('Internal server error')
  })

  it('falls back to the status when the failure has no JSON body', async () => {
    const post = () => Promise.reject(new HttpError(502, 'Bad Gateway', null))
    const error = await new CidrHttpAdapter(httpClient({ post })).calculateRange('x').catch((e: unknown) => e)
    expect((error as Error).message).toBe('Request failed (502)')
  })

  it('explains a network failure', async () => {
    const post = () => Promise.reject(new TypeError('Failed to fetch'))
    const error = await new CidrHttpAdapter(httpClient({ post })).calculateRange('x').catch((e: unknown) => e)
    expect((error as Error).message).toBe('Could not reach the CIDR API (Failed to fetch)')
  })
})
