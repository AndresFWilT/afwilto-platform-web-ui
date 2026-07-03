import type { IHttpClient } from '@/application/ports'
import type {
  ILCRSService,
  NaryTree,
  BinaryTree,
  TransformResult,
  ShortestPathResult,
  BinaryTraversalResult,
  BinaryTraversalOrder,
} from '@/application/ports/ILCRSService'

type ApiResponse<T> = { data: T }

export class LCRSHttpAdapter implements ILCRSService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async transform(naryTree: NaryTree): Promise<TransformResult> {
    try {
      const res = await this.http.post<ApiResponse<TransformResult>>(
        '/api/v1/lcrs/transform',
        { naryTree }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async shortestPath(naryTree: NaryTree): Promise<ShortestPathResult> {
    try {
      const res = await this.http.post<ApiResponse<ShortestPathResult>>(
        '/api/v1/lcrs/shortest-path',
        { naryTree }
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async traverse(binaryTree: BinaryTree, order: BinaryTraversalOrder): Promise<BinaryTraversalResult> {
    try {
      const res = await this.http.post<ApiResponse<BinaryTraversalResult>>(
        '/api/v1/lcrs/traverse',
        { binaryTree, order }
      )
      return res.data
    } catch (e) {
      throw translateTraverse(e)
    }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('DUPLICATE_LABEL')) return new Error('Each node label must be unique')
  if (m.includes('ORPHAN_NODE')) return new Error('All nodes must be reachable from the root')
  if (m.includes('INVALID_WEIGHT')) return new Error('Edge weights must be non-negative')
  if (m.includes('EMPTY_TREE')) return new Error('Tree cannot be empty')
  if (m.includes('INVALID_TREE_STRUCTURE')) return new Error('Invalid tree structure')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  }
  return e
}

function translateTraverse(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
    return new Error('Cannot traverse — backend unreachable')
  }
  return e
}
