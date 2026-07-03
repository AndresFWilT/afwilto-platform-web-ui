import type { IHttpClient } from '@/application/ports'
import type { DFSResult, IDFSService } from '@/application/ports/IDFSService'

type ApiResponse<T> = { data: T }

export class DFSHttpAdapter implements IDFSService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async solve(
    adjacency: Record<string, string[]>,
    start: string,
    goal?: string,
  ): Promise<DFSResult> {
    try {
      const res = await this.http.post<ApiResponse<DFSResult>>(
        '/api/v1/dfs/solve',
        { adjacency, start, goal: goal ?? null },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async step(
    adjacency: Record<string, string[]>,
    start: string,
    stepIndex: number,
    goal?: string,
  ): Promise<DFSResult> {
    try {
      const res = await this.http.post<ApiResponse<DFSResult>>(
        '/api/v1/dfs/step',
        { adjacency, start, goal: goal ?? null, step_index: stepIndex },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('404')) return new Error('Vertex not found in graph.')
  if (msg.includes('422')) return new Error('Goal is not reachable from start vertex.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is artificial-intelligence-mngr running on :8090?')
  return e
}
