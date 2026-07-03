import type { IHttpClient } from '@/application/ports'
import type {
  IMixedIntegerService,
  MIPRequest,
  MIPResult,
} from '@/application/ports/IMixedIntegerService'

type ApiResponse<T> = { data: T }

export class MixedIntegerHttpAdapter implements IMixedIntegerService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async solve(request: MIPRequest): Promise<MIPResult> {
    try {
      const res = await this.http.post<ApiResponse<MIPResult>>(
        '/api/v1/mixed-integer/solve',
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
  if (m.includes('VALIDATION_ERROR')) return new Error('Invalid problem structure: ' + m)
  return e
}
