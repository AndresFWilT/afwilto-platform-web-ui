import type { IHttpClient } from '@/application/ports'
import type {
  AStarResult,
  EdgeInput,
  IAStarService,
  VertexInput,
} from '@/application/ports/IAStarService'

type ApiResponse<T> = { data: T }

export class AStarHttpAdapter implements IAStarService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async solve(
    vertices: VertexInput[],
    edges: EdgeInput[],
    start: string,
    goal: string,
  ): Promise<AStarResult> {
    try {
      const res = await this.http.post<ApiResponse<AStarResult>>(
        '/api/v1/astar/solve',
        { vertices, edges, start, goal },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async step(
    vertices: VertexInput[],
    edges: EdgeInput[],
    start: string,
    goal: string,
    stepIndex: number,
  ): Promise<AStarResult> {
    try {
      const res = await this.http.post<ApiResponse<AStarResult>>(
        '/api/v1/astar/step',
        { vertices, edges, start, goal, step_index: stepIndex },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('404')) return new Error('Vertex not found in graph.')
  if (msg.includes('422')) return new Error('Goal is unreachable from start vertex.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is artificial-intelligence-mngr running on :8090?')
  return e
}
