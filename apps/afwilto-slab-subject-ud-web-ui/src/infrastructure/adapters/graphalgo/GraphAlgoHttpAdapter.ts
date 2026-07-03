import type { IHttpClient } from '@/application/ports'
import type {
  IGraphAlgoService,
  GraphEdge,
  ShortestPathResult,
  MSTResult,
} from '@/application/ports/IGraphAlgoService'

type ApiResponse<T> = { data: T }

export class GraphAlgoHttpAdapter implements IGraphAlgoService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async computeShortestPath(vertexCount: number, edges: GraphEdge[], source: number): Promise<ShortestPathResult> {
    try {
      const res = await this.http.post<ApiResponse<ShortestPathResult>>(
        '/api/v1/graph/shortest-path',
        { vertexCount, edges, source }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async computeMST(vertexCount: number, edges: GraphEdge[]): Promise<MSTResult> {
    try {
      const res = await this.http.post<ApiResponse<MSTResult>>(
        '/api/v1/graph/mst',
        { vertexCount, edges }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async computeKruskalMST(vertexCount: number, edges: GraphEdge[]): Promise<MSTResult> {
    try {
      const res = await this.http.post<ApiResponse<MSTResult>>(
        '/api/v1/graph/kruskal',
        { vertexCount, edges }
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
  if (msg.includes('INVALID_WEIGHT'))      return new Error('Edge weights must be positive integers.')
  if (msg.includes('SOURCE_OUT_OF_RANGE')) return new Error('Source vertex index is out of range.')
  if (msg.includes('DISCONNECTED_GRAPH'))  return new Error('Graph is disconnected — MST requires a connected graph.')
  if (msg.includes('VERTEX_OUT_OF_RANGE')) return new Error('An edge references a vertex that does not exist.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  return e
}
