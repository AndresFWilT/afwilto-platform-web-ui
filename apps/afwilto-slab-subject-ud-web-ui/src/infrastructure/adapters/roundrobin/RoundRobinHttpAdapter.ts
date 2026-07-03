import type { IHttpClient } from '@/application/ports'
import type {
  IRoundRobinService,
  ProcessInput,
  SchedulerState,
  SimulateResponse,
} from '@/application/ports/IRoundRobinService'

type ApiResponse<T> = { data: T }

export class RoundRobinHttpAdapter implements IRoundRobinService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async simulate(timeQuantum: number, processes: ProcessInput[]): Promise<SimulateResponse> {
    try {
      const res = await this.http.post<ApiResponse<SimulateResponse>>(
        '/api/v1/round-robin/simulate',
        { timeQuantum, processes },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async tick(state: SchedulerState): Promise<SchedulerState> {
    try {
      const res = await this.http.post<ApiResponse<SchedulerState>>(
        '/api/v1/round-robin/tick',
        { state },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async enqueue(state: SchedulerState, pid: number, burstTime: number): Promise<SchedulerState> {
    try {
      const res = await this.http.post<ApiResponse<SchedulerState>>(
        '/api/v1/round-robin/enqueue',
        { state, pid, burstTime },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async block(state: SchedulerState, pid: number): Promise<SchedulerState> {
    try {
      const res = await this.http.post<ApiResponse<SchedulerState>>(
        '/api/v1/round-robin/block',
        { state, pid },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async unblock(state: SchedulerState, pid: number): Promise<SchedulerState> {
    try {
      const res = await this.http.post<ApiResponse<SchedulerState>>(
        '/api/v1/round-robin/unblock',
        { state, pid },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('404')) return new Error('Process not found in queue.')
  if (msg.includes('400')) return new Error('Invalid input — check time quantum and burst times.')
  if (msg.includes('409')) return new Error('Duplicate process ID.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is operative-system-mngr running on :8089?')
  return e
}
