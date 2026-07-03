import type { IHttpClient } from '@/application/ports'
import type {
  ITrieService,
  Trie,
  TrieOperationResult,
  TrieSearchResult,
  TraversalResult,
  TraversalOrder,
} from '@/application/ports/ITrieService'

type ApiResponse<T> = { data: T }

export class TrieHttpAdapter implements ITrieService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async insert(trie: Trie, word: string, translation: string): Promise<TrieOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<TrieOperationResult>>(
        '/api/v1/trie/insert',
        { trie, word, translation }
      )
      return res.data
    } catch (e) {
      throw translate(e, word)
    }
  }

  async delete(trie: Trie, word: string): Promise<TrieOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<TrieOperationResult>>(
        '/api/v1/trie/delete',
        { trie, word }
      )
      return res.data
    } catch (e) {
      throw translate(e, word)
    }
  }

  async searchPrefix(trie: Trie, prefix: string): Promise<TrieSearchResult> {
    try {
      const res = await this.http.post<ApiResponse<TrieSearchResult>>(
        '/api/v1/trie/search',
        { trie, prefix }
      )
      return res.data
    } catch (e) {
      throw translateSearch(e, prefix)
    }
  }

  async traverse(trie: Trie, order: TraversalOrder): Promise<TraversalResult> {
    try {
      const res = await this.http.post<ApiResponse<TraversalResult>>(
        '/api/v1/trie/traverse',
        { trie, order }
      )
      return res.data
    } catch (e) {
      throw translateTraverse(e)
    }
  }
}

function translate(e: unknown, word: string): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('WORD_EXISTS')) return new Error(`Word "${word}" already exists in the dictionary`)
  if (m.includes('WORD_NOT_FOUND')) return new Error(`Word "${word}" was not found`)
  if (m.includes('EMPTY_WORD')) return new Error('Word cannot be empty')
  if (m.includes('INVALID_CHARACTER')) return new Error('Word must contain only lowercase letters (a-z)')
  if (m.includes('INVALID_TRIE')) return new Error('The trie structure is invalid')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  }
  return e
}

function translateSearch(e: unknown, prefix: string): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('INVALID_TRIE')) return new Error('The trie structure is invalid')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error(`Cannot search prefix "${prefix}" — backend unreachable`)
  }
  return e
}

function translateTraverse(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('INVALID_ORDER')) return new Error('Traversal order not recognized')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot traverse — backend unreachable')
  }
  return e
}
