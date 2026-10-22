import { HttpError, type IHttpClient } from '@afwilto/http-client'
import type { ICidrCalculator } from '@/cidr/application/ports'
import { CidrValidationError, type Violation } from '@/cidr/application/errors'
import type { Aggregation, CidrRange, IpFamily, PrefixTable, RangeSummary } from '@/cidr/domain/types'

interface Envelope<T> {
  data: T
}

interface WireError {
  error?: { code?: string; message?: string; details?: Violation[] }
}

/** HTTP failures → the port's errors; status codes never leave the adapter. */
function translate(e: unknown): Error {
  if (e instanceof HttpError) {
    const error = (e.body as WireError | null)?.error
    const details = Array.isArray(error?.details) ? error.details : []
    if (e.status === 422 && details.length) return new CidrValidationError(details)
    if (error?.message) return new Error(error.message)
    return new Error(`Request failed (${e.status})`)
  }
  const reason = e instanceof Error ? e.message : String(e)
  return new Error(`Could not reach the CIDR API (${reason})`)
}

/** Calls afwilto-slab-cidr-mngr (api/openapi.yaml) and unwraps `{ data }`. */
export class CidrHttpAdapter implements ICidrCalculator {
  private readonly http: IHttpClient

  constructor(http: IHttpClient) {
    this.http = http
  }

  calculateRange(cidr: string): Promise<CidrRange> {
    return this.unwrap(() => this.http.post<Envelope<CidrRange>>('/cidr/range', { cidr }))
  }

  summarizeRange(firstIp: string, lastIp: string): Promise<RangeSummary> {
    return this.unwrap(() => this.http.post<Envelope<RangeSummary>>('/cidr/summarize', { firstIp, lastIp }))
  }

  aggregate(addresses: string[]): Promise<Aggregation> {
    return this.unwrap(() => this.http.post<Envelope<Aggregation>>('/cidr/aggregate', { addresses }))
  }

  prefixTable(family: IpFamily): Promise<PrefixTable> {
    const query = new URLSearchParams({ family }).toString()
    return this.unwrap(() => this.http.get<Envelope<PrefixTable>>(`/cidr/prefix-table?${query}`))
  }

  private async unwrap<T>(request: () => Promise<Envelope<T>>): Promise<T> {
    try {
      return (await request()).data
    } catch (e) {
      throw translate(e)
    }
  }
}
