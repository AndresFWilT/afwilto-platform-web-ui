import type { IHttpClient } from '@/application/ports'
import type { ITruthTableService, TruthTableResult } from '@/application/ports/ITruthTableService'

type ApiResponse<T> = { data: T }

export class TruthTableHttpAdapter implements ITruthTableService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async generate(formula: string): Promise<TruthTableResult> {
    try {
      const res = await this.http.post<ApiResponse<TruthTableResult>>(
        '/api/v1/truth-table/generate',
        { formula }
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
  if (m.includes('EMPTY_FORMULA'))         return new Error('Formula cannot be empty')
  if (m.includes('UNMATCHED_PARENTHESIS')) return new Error('Unmatched parenthesis in formula')
  if (m.includes('INVALID_TOKEN'))         return new Error('Invalid character in formula')
  if (m.includes('TOO_MANY_VARIABLES'))    return new Error('Formula has more than 8 distinct variables')
  if (m.includes('INVALID_EXPRESSION'))    return new Error('Invalid expression structure')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the CS service — is cs-mngr running on :8081?')
  }
  return e
}
