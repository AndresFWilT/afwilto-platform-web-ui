import type { IHttpClient } from '@/application/ports'
import type {
  IRBTService,
  SnapshotResponse,
  SearchResponse,
  TraversalResponse,
  ExtremesResponse,
  TraversalOrder,
} from '@/application/ports/IRBTService'

type ApiResponse<T> = { data: T }

export class RBTHttpAdapter implements IRBTService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async insert(key: number): Promise<void> {
    try {
      await this.http.post<ApiResponse<unknown>>('/api/v1/rbt/nodes', { key })
    } catch (e) {
      throw translate(e, key)
    }
  }

  async delete(key: number): Promise<void> {
    try {
      await this.http.delete<ApiResponse<unknown>>(`/api/v1/rbt/nodes/${key}`)
    } catch (e) {
      throw translate(e, key)
    }
  }

  async search(key: number): Promise<SearchResponse> {
    try {
      const res = await this.http.get<ApiResponse<SearchResponse>>(`/api/v1/rbt/nodes/${key}`)
      return res.data
    } catch (e) {
      throw translate(e, key)
    }
  }

  async traversal(order: TraversalOrder): Promise<TraversalResponse> {
    try {
      const res = await this.http.get<ApiResponse<TraversalResponse>>(
        `/api/v1/rbt/traversal?order=${order}`
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async getTree(): Promise<SnapshotResponse> {
    try {
      const res = await this.http.get<ApiResponse<SnapshotResponse>>('/api/v1/rbt/tree')
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async getExtremes(): Promise<ExtremesResponse> {
    try {
      const res = await this.http.get<ApiResponse<ExtremesResponse>>('/api/v1/rbt/extremes')
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }
}

function translate(e: unknown, key?: number): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('409')) return new Error(`Key ${key} already exists in the tree`)
  if (msg.includes('404')) return new Error(`Key ${key} not found in the tree`)
  if (msg.includes('422')) return new Error('Tree is empty')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  return e
}
