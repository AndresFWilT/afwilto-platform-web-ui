import type { IHttpClient } from '@/application/ports'
import type {
  IHashDispersionService,
  HashEntry,
  DispersionTable,
  SearchResult,
} from '@/application/ports/IHashDispersionService'

type ApiResponse<T> = { data: T }

export class HashDispersionHttpAdapter implements IHashDispersionService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async disperse(modulus: number, entries: HashEntry[]): Promise<DispersionTable> {
    try {
      const res = await this.http.post<ApiResponse<DispersionTable>>(
        '/api/v1/hash-dispersion/disperse',
        { modulus, entries }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async remove(table: DispersionTable, key: number): Promise<DispersionTable> {
    try {
      const res = await this.http.post<ApiResponse<DispersionTable>>(
        '/api/v1/hash-dispersion/remove',
        { table, key }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async search(table: DispersionTable, key: number): Promise<SearchResult> {
    try {
      const res = await this.http.post<ApiResponse<SearchResult>>(
        '/api/v1/hash-dispersion/search',
        { table, key }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('NOT_PRIME'))     return new Error('Modulus must be a prime number (e.g. 7, 11, 13, 17).')
  if (msg.includes('DUPLICATE_KEY')) return new Error('Duplicate key — each key must appear only once.')
  if (msg.includes('KEY_NOT_FOUND')) return new Error('Key not found in the table.')
  if (msg.includes('TABLE_FULL'))    return new Error('Table is full — add more overflow slots.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  return e
}
