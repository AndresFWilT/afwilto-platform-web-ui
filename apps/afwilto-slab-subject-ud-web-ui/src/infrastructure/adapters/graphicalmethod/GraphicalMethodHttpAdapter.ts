import type { IHttpClient } from '@/application/ports'
import type {
  IGraphicalMethodService,
  GraphicalMethodRequest,
  GraphicalSolution,
} from '@/application/ports/IGraphicalMethodService'

type ApiResponse<T> = { data: T }

export class GraphicalMethodHttpAdapter implements IGraphicalMethodService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async solve(request: GraphicalMethodRequest): Promise<GraphicalSolution> {
    try {
      const res = await this.http.post<ApiResponse<GraphicalSolution>>(
        '/api/v1/graphical-method/solve',
        request,
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach backend — is operations-research-mngr running on :8088?')
  }
  return e
}
