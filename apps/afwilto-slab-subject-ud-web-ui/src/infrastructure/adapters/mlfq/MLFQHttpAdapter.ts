import type { IHttpClient } from '@/application/ports'
import type {
  IMLFQService,
  MLFQConfig,
  MLFQQueueLevel,
  MLFQSimulateQueues,
  MLFQSimulateResponse,
  MLFQState,
} from '@/application/ports/IMLFQService'

type ApiResponse<T> = { data: T }

export class MLFQHttpAdapter implements IMLFQService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async simulate(config: MLFQConfig, queues: MLFQSimulateQueues): Promise<MLFQSimulateResponse> {
    try {
      const res = await this.http.post<ApiResponse<MLFQSimulateResponse>>(
        '/api/v1/mlfq/simulate',
        { config, queues },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async tick(state: MLFQState): Promise<MLFQState> {
    try {
      const res = await this.http.post<ApiResponse<MLFQState>>('/api/v1/mlfq/tick', { state })
      return res.data
    } catch (e) { throw translate(e) }
  }

  async enqueue(state: MLFQState, pid: number, name: string, burstTime: number, queueLevel: MLFQQueueLevel): Promise<MLFQState> {
    try {
      const res = await this.http.post<ApiResponse<MLFQState>>(
        '/api/v1/mlfq/enqueue',
        { state, pid, name, burstTime, queueLevel },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async block(state: MLFQState, pid: number): Promise<MLFQState> {
    try {
      const res = await this.http.post<ApiResponse<MLFQState>>('/api/v1/mlfq/block', { state, pid })
      return res.data
    } catch (e) { throw translate(e) }
  }

  async unblock(state: MLFQState, pid: number): Promise<MLFQState> {
    try {
      const res = await this.http.post<ApiResponse<MLFQState>>('/api/v1/mlfq/unblock', { state, pid })
      return res.data
    } catch (e) { throw translate(e) }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('400')) return new Error('Invalid input — check quantum, aging threshold, and burst times.')
  if (msg.includes('409')) return new Error('Duplicate process ID.')
  if (msg.includes('404')) return new Error('Process not found.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is operative-system-mngr running on :8089?')
  return e
}
