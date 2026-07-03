import type { IHttpClient } from '@/application/ports'
import type {
  ITopologicalSortService,
  TopologicalSortResult,
} from '@/application/ports/ITopologicalSortService'

type ApiResponse<T> = { data: T }

export class TopologicalSortHttpAdapter implements ITopologicalSortService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async compute(vertexCount: number, adjacencyList: Record<number, number[]>): Promise<TopologicalSortResult> {
    try {
      const res = await this.http.post<ApiResponse<TopologicalSortResult>>(
        '/api/v1/topological-sort/compute',
        { vertexCount, adjacencyList }
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
  if (msg.includes('CYCLIC_GRAPH'))      return new Error('Graph contains a cycle — topological sort requires a DAG (no cycles).')
  if (msg.includes('EMPTY_GRAPH'))       return new Error('Graph has no vertices — add at least one.')
  if (msg.includes('INVALID_ADJACENCY')) return new Error('Adjacency list references a vertex out of range or contains a self-loop.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  return e
}
