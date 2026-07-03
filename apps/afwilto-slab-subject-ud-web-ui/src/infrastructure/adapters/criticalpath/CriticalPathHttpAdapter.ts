import type { IHttpClient } from '@/application/ports'
import type {
  ICriticalPathService,
  ActivityInput,
  CriticalPathResult,
} from '@/application/ports/ICriticalPathService'

type ApiResponse<T> = { data: T }

export class CriticalPathHttpAdapter implements ICriticalPathService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async compute(activities: ActivityInput[]): Promise<CriticalPathResult> {
    try {
      const res = await this.http.post<ApiResponse<CriticalPathResult>>(
        '/api/v1/critical-path/compute',
        { activities }
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
  if (m.includes('CYCLIC_DEPENDENCY'))   return new Error('Cyclic dependency detected — activities cannot form a loop')
  if (m.includes('MISSING_PREDECESSOR')) return new Error('An activity references a predecessor that does not exist')
  if (m.includes('INVALID_DURATION'))    return new Error('All activity durations must be greater than zero')
  if (m.includes('EMPTY_PROJECT'))       return new Error('Add at least one activity before computing')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the CS service — is cs-mngr running on :8081?')
  }
  return e
}
