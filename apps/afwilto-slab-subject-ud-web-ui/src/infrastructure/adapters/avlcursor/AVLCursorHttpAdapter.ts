import type { IHttpClient } from '@/application/ports'
import type {
  IAVLCursorService,
  CursorState,
  CursorOperationResult,
} from '@/application/ports/IAVLCursorService'

type ApiResponse<T> = { data: T }

export class AVLCursorHttpAdapter implements IAVLCursorService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async initialize(name: string, capacity: number): Promise<CursorState> {
    try {
      const res = await this.http.post<ApiResponse<{ cursor: CursorState }>>(
        '/api/v1/avl-cursor/initialize',
        { name, capacity }
      )
      return res.data.cursor
    } catch (e) {
      throw translate(e)
    }
  }

  async insert(cursor: CursorState, key: string): Promise<CursorOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<CursorOperationResult>>(
        '/api/v1/avl-cursor/insert',
        { cursor, key }
      )
      return res.data
    } catch (e) {
      throw translate(e, key)
    }
  }

  async delete(cursor: CursorState, key: string): Promise<CursorOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<CursorOperationResult>>(
        '/api/v1/avl-cursor/delete',
        { cursor, key }
      )
      return res.data
    } catch (e) {
      throw translate(e, key)
    }
  }
}

function translate(e: unknown, key?: string): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('KEY_EXISTS')) return new Error(`Key "${key}" already exists (same letter-sum)`)
  if (m.includes('KEY_NOT_FOUND')) return new Error(`Key "${key}" was not found`)
  if (m.includes('TABLE_FULL')) return new Error('The cursor table is full — re-initialize with a larger capacity')
  if (m.includes('EMPTY_KEY')) return new Error('Key cannot be empty')
  if (m.includes('INVALID_CURSOR')) return new Error('The cursor table is invalid')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  }
  return e
}
