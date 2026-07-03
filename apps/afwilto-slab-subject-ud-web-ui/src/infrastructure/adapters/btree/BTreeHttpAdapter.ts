import type { IHttpClient } from '@/application/ports'
import type {
  IBTreeService,
  BTree,
  BTreeOperationResult,
} from '@/application/ports/IBTreeService'

type ApiResponse<T> = { data: T }

export class BTreeHttpAdapter implements IBTreeService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async insert(tree: BTree, key: string): Promise<BTreeOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<BTreeOperationResult>>(
        '/api/v1/btree/insert',
        { tree, key }
      )
      return res.data
    } catch (e) {
      throw translate(e, key)
    }
  }

  async delete(tree: BTree, key: string): Promise<BTreeOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<BTreeOperationResult>>(
        '/api/v1/btree/delete',
        { tree, key }
      )
      return res.data
    } catch (e) {
      throw translate(e, key)
    }
  }

  async find(tree: BTree, key: string): Promise<BTreeOperationResult> {
    try {
      const res = await this.http.post<ApiResponse<BTreeOperationResult>>(
        '/api/v1/btree/find',
        { tree, key }
      )
      return res.data
    } catch (e) {
      throw translate(e, key)
    }
  }
}

function translate(e: unknown, key: string): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('KEY_EXISTS')) return new Error(`Key "${key}" already exists in the tree`)
  if (m.includes('KEY_NOT_FOUND')) return new Error(`Key "${key}" was not found`)
  if (m.includes('INVALID_ORDER')) return new Error('Order must be at least 1')
  if (m.includes('EMPTY_KEY')) return new Error('Key cannot be empty')
  if (m.includes('INVALID_TREE')) return new Error('The tree structure is invalid')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the backend — is computer-science-mngr running on :8081?')
  }
  return e
}
