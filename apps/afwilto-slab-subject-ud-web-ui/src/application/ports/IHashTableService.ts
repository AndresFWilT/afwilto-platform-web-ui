// Inbound port — domain language only. Three methods, not one (ISP).

export interface HashEntry {
  key: number
  label: string
}

export interface HashBucket {
  bucketIndex: number
  chain: HashEntry[]
}

export interface HashTable {
  modulus: number
  buckets: HashBucket[] // sparse — empty buckets are omitted
}

export interface HashLocation {
  bucketIndex: number
  chainIndex: number
}

export type HashOperationType = 'INSERT' | 'DELETE' | 'FIND'

export interface HashOperation {
  type: HashOperationType
  key: number
  location: HashLocation
}

export interface HashOperationResult {
  table: HashTable
  operation: HashOperation
}

export interface IHashTableService {
  insert(table: HashTable, entry: HashEntry): Promise<HashOperationResult>
  delete(table: HashTable, key: number): Promise<HashOperationResult>
  find(table: HashTable, key: number): Promise<HashOperationResult>
}
