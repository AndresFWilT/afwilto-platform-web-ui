export type { GraphicalMethodRequest, GraphicalSolution, GraphicalConstraint, Point2D } from '@/application/ports/IGraphicalMethodService'

export interface ConstraintRow {
  a: string
  b: string
  sign: 'LE' | 'GE' | 'EQ'
  rhs: string
}
