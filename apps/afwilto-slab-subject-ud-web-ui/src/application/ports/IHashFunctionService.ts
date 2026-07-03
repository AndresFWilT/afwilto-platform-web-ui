// Inbound port — domain language only. No HTTP, no infrastructure.

export type HashMethod = 'DIVISION' | 'MID_SQUARE' | 'FOLDING' | 'TRANSFORMATION'

export interface HashFunctionRequest {
  method: HashMethod
  key: number
  prime?: number
  bitWidth?: number
  base?: number
  arraySize?: number
}

export interface HashFunctionResult {
  method: HashMethod
  hashIndex: number
  steps: Record<string, string | number | string[]>
}

export interface IHashFunctionService {
  compute(request: HashFunctionRequest): Promise<HashFunctionResult>
}
