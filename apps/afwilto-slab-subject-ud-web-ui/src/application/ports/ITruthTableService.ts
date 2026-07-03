export interface TruthTableRow {
  assignments: Record<string, boolean>
  result: boolean
}

export type Classification = 'tautology' | 'contradiction' | 'contingency'

export interface TruthTableResult {
  formula: string
  variables: string[]
  rows: TruthTableRow[]
  classification: Classification
}

export interface ITruthTableService {
  generate(formula: string): Promise<TruthTableResult>
}
