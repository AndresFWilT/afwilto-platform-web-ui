import type { IHttpClient } from '@/application/ports'
import type { IHuffmanService, HuffmanEncodingResult } from '@/application/ports/IHuffmanService'

type ApiResponse<T> = { data: T }

export class HuffmanHttpAdapter implements IHuffmanService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async encode(text: string): Promise<HuffmanEncodingResult> {
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
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('EMPTY_INPUT')) return new Error('Input text cannot be empty')
  if (m.includes('SINGLE_CHARACTER')) return new Error('Huffman coding requires at least two distinct symbols')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  }
  return e
}
