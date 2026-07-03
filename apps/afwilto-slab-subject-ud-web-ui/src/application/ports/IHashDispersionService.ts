// Inbound port — domain language only. No HTTP, no infrastructure.

export interface HashEntry {
  key: number
  value: string
}

export interface Slot {
  position: number
  key: number
  value: string
  nextCursor: number
}

export interface BucketHead {
  module: number
  headPosition: number
  chain: number[]
}

export interface DispersionTable {
  modulus: number
  bucketHeads: BucketHead[]
  dataArray: Slot[]
  nextAvailable: number
  capacity: number
}

export interface SearchResult {
  found: boolean
  bucketModule: number
  traversalPath: number[]
  slotPosition: number
}

export interface IHashDispersionService {
  disperse(modulus: number, entries: HashEntry[]): Promise<DispersionTable>
  remove(table: DispersionTable, key: number): Promise<DispersionTable>
  search(table: DispersionTable, key: number): Promise<SearchResult>
}
