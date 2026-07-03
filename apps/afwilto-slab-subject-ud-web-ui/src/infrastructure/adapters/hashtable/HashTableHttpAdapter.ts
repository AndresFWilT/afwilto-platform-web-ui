import type { IHttpClient } from '@/application/ports'
import type {
  IHashTableService,
  HashTable,
  HashEntry,
  HashOperationResult,
} from '@/application/ports/IHashTableService'

type ApiResponse<T> = { data: T }

export class HashTableHttpAdapter implements IHashTableService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async insert(table: HashTable, entry: HashEntry): Promise<HashOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<HashOperationResult>>(
        '/api/v1/hash-table/insert',
        { table, entry }
      )
      return res.data
    } catch (e) {
      throw translate(e, entry.key)
    }
  }

  async delete(table: HashTable, key: number): Promise<HashOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<HashOperationResult>>(
        '/api/v1/hash-table/delete',
        { table, key }
      )
      return res.data
    } catch (e) {
      throw translate(e, key)
    }
  }

  async find(table: HashTable, key: number): Promise<HashOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<HashOperationResult>>(
        '/api/v1/hash-table/find',
        { table, key }
      )
      return res.data
    } catch (e) {
      throw translate(e, key)
    }
  }
}

function translate(e: unknown, key?: number): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('KEY_EXISTS'))    return new Error(`Key ${key} already exists in the table`)
  if (msg.includes('KEY_NOT_FOUND')) return new Error(`Key ${key} was not found in the table`)
  if (msg.includes('NOT_PRIME'))     return new Error(`Modulus ${key} is not a prime number`)
  if (msg.includes('INVALID_KEY'))   return new Error('Keys must be non-negative integers')
  if (msg.includes('INVALID_TABLE')) return new Error('Table structure is invalid')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  return e
}
