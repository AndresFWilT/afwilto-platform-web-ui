import type { IHttpClient } from '@/application/ports'
import type {
  IGraphTraversalService,
  TraversalResult,
} from '@/application/ports/IGraphTraversalService'

type ApiResponse<T> = { data: T }

export class GraphTraversalHttpAdapter implements IGraphTraversalService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async bfs(vertexCount: number, adjacencyList: Record<number, number[]>, source: number): Promise<TraversalResult> {
    try {
      const res = await this.http.post<ApiResponse<TraversalResult>>(
        '/api/v1/graph-traversal/bfs',
        { vertexCount, adjacencyList, source }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async dfs(vertexCount: number, adjacencyList: Record<number, number[]>, source: number): Promise<TraversalResult> {
    try {
      const res = await this.http.post<ApiResponse<TraversalResult>>(
        '/api/v1/graph-traversal/dfs',
        { vertexCount, adjacencyList, source }
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
  if (msg.includes('EMPTY_GRAPH'))         return new Error('The graph has no vertices — add at least one.')
  if (msg.includes('SOURCE_OUT_OF_RANGE')) return new Error('Source vertex index is out of range.')
  if (msg.includes('INVALID_ADJACENCY'))   return new Error('Adjacency list is invalid — check vertex numbers are in range and no vertex points to itself.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  return e
}
