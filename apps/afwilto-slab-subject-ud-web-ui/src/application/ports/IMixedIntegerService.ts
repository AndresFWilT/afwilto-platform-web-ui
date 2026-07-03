export type VariableType = 'CONTINUOUS' | 'INTEGER'
export type MIPOptimizationType = 'MAXIMIZE' | 'MINIMIZE'
export type MIPSign = 'LE' | 'GE' | 'EQ'

export interface MIPVariable {
  name: string
  type: VariableType
}

export interface MIPObjective {
  coefficients: number[]
  type: MIPOptimizationType
}

export interface MIPConstraint {
  coefficients: number[]
  sign: MIPSign
  rhs: number
}

export interface MIPRequest {
  variables: MIPVariable[]
  objective: MIPObjective
  constraints: MIPConstraint[]
}

export interface MIPResult {
  status: 'OPTIMAL' | 'INFEASIBLE' | 'UNBOUNDED'
  optimalValue: number | null
  assignments: Record<string, number> | null
}

export interface IMixedIntegerService {
  solve(request: MIPRequest): Promise<MIPResult>
}
