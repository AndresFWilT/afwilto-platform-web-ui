export type { MIPRequest, MIPResult, MIPVariable, MIPConstraint } from '@/application/ports/IMixedIntegerService'

export interface VariableRow {
  name: string
  type: 'CONTINUOUS' | 'INTEGER'
}

export interface ConstraintRow {
  coefficients: string[]
  sign: 'LE' | 'GE' | 'EQ'
  rhs: string
}
