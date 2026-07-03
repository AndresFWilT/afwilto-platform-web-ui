import type { IHttpClient } from '@/application/ports'
import type {
  IHashFunctionService,
  HashFunctionRequest,
  HashFunctionResult,
} from '@/application/ports/IHashFunctionService'

type ApiResponse<T> = { data: T }

export class HashFunctionHttpAdapter implements IHashFunctionService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async compute(request: HashFunctionRequest): Promise<HashFunctionResult> {
    try {
      const res = await this.http.post<ApiResponse<HashFunctionResult>>(
        '/api/v1/hash-function/compute',
        {
          method:    request.method,
          key:       request.key,
          prime:     request.prime     ?? 0,
          bitWidth:  request.bitWidth  ?? 0,
          base:      request.base      ?? 0,
          arraySize: request.arraySize ?? 0,
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
  if (msg.includes('NOT_PRIME'))          return new Error('Modulus must be a prime number (e.g. 7, 11, 13).')
  if (msg.includes('INVALID_BIT_WIDTH'))  return new Error('Bit width must be between 1 and 32.')
  if (msg.includes('INVALID_BASE'))       return new Error('Base must be between 2 and 16.')
  if (msg.includes('INVALID_ARRAY_SIZE')) return new Error('Array size must be greater than zero.')
  if (msg.includes('NEGATIVE_KEY'))       return new Error('Key must be a non-negative integer.')
  if (msg.includes('UNKNOWN_METHOD'))     return new Error('Unknown hash method.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  return e
}
