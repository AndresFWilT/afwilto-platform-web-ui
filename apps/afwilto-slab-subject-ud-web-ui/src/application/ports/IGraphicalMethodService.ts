export type OptimizationType = 'MAXIMIZE' | 'MINIMIZE'
export type Sign = 'LE' | 'GE' | 'EQ'

export interface GraphicalObjective {
  coefficients: [number, number]
  type: OptimizationType
}

export interface GraphicalConstraint {
  coefficients: [number, number]
  sign: Sign
  rhs: number
}

export interface GraphicalMethodRequest {
  objective: GraphicalObjective
  constraints: GraphicalConstraint[]
  integerVariables: [boolean, boolean]
}

export interface Point2D {
  x: number
  y: number
}

export interface ConstraintLineData {
  index: number
  xIntercept: number | null
  yIntercept: number | null
  slope: number | null
}

export interface IntersectionPoint {
  point: Point2D
  constraintPair: [number, number]
  feasible: boolean
}

export interface GraphicalSolution {
  status: 'OPTIMAL' | 'INFEASIBLE' | 'UNBOUNDED'
  optimalValue: number | null
  optimalPoint: Point2D | null
  constraintLines: ConstraintLineData[]
  intersections: IntersectionPoint[]
  feasibleVertices: Point2D[]
  classification: 'BOUNDED' | 'UNBOUNDED' | 'INFEASIBLE' | null
}

export interface IGraphicalMethodService {
  solve(request: GraphicalMethodRequest): Promise<GraphicalSolution>
}
