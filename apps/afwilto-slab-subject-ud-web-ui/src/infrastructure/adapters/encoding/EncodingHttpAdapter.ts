import type { IHttpClient } from '@/application/ports'
import type {
  IEncodingService,
  HuffmanEncodingResult,
  ShannonFanoEncodingResult,
} from '@/application/ports/IEncodingService'

type ApiResponse<T> = { data: T }

export class EncodingHttpAdapter implements IEncodingService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async encodeHuffman(text: string): Promise<HuffmanEncodingResult> {
    try {
      const res = await this.http.post<ApiResponse<HuffmanEncodingResult>>(
        '/api/v1/huffman/encode',
        { text }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async encodeShannonFano(text: string): Promise<ShannonFanoEncodingResult> {
    try {
      const res = await this.http.post<ApiResponse<ShannonFanoEncodingResult>>(
        '/api/v1/shannon-fano/encode',
        { text }
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
  if (m.includes('EMPTY_INPUT'))     return new Error('Input text cannot be empty')
  if (m.includes('SINGLE_CHARACTER')) return new Error('Input must contain at least 2 distinct characters')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the encoding service — is network-communication-mngr running on :8086?')
  }
  return e
}
