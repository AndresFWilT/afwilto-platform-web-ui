import type { IHttpClient } from '@/application/ports'
import type {
  IChromaticGraphService,
  ChromaticEstimate,
  EstimateChromaticNumberRequest,
} from '@/application/ports/IChromaticGraphService'

type ApiResponse<T> = { data: T }

export class ChromaticGraphHttpAdapter implements IChromaticGraphService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async estimate(req: EstimateChromaticNumberRequest): Promise<ChromaticEstimate> {
    try {
      const res = await this.http.post<ApiResponse<ChromaticEstimate>>(
        '/api/v1/chromatic/estimate',
        {
          adjacencyMatrix: req.adjacencyMatrix,
          startVertex: req.startVertex ?? 0,
          symmetrize: req.symmetrize ?? false,
        }
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
  if (msg.includes('EMPTY_GRAPH'))       return new Error('The graph has no vertices — add at least one.')
  if (msg.includes('ASYMMETRIC_MATRIX')) return new Error('Adjacency matrix is not symmetric. Enable "Symmetrize" or fix the matrix.')
  if (msg.includes('VERTEX_OUT_OF_RANGE')) return new Error('Start vertex index is out of range.')
  if (msg.includes('INVALID_MATRIX'))    return new Error('Invalid adjacency matrix — values must be 0 or 1 with no self-loops.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  return e
}
