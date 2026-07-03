export interface VertexInput {
  id: string
  heuristic: number
}

export interface EdgeInput {
  from_vertex: string
  to_vertex: string
  cost: number
}

export interface FrontierEntry {
  vertexId: string
  pathCost: number
  heuristic: number
  totalEstimate: number
}

export type ExpansionAction = 'EXPANDED' | 'GOAL_REACHED' | 'SKIPPED'

export interface ExpansionStep {
  vertexId: string
  pathCost: number
  heuristic: number
  totalEstimate: number
  frontierSize: number
  action: ExpansionAction
  frontierSnapshot: FrontierEntry[]
  closedSet: string[]
}

export interface AStarResult {
  solutionPath: string[]
  totalCost: number
  steps: ExpansionStep[]
  verticesExpanded: number
}

export interface IAStarService {
  solve(
    vertices: VertexInput[],
    edges: EdgeInput[],
    start: string,
    goal: string,
  ): Promise<AStarResult>

  step(
    vertices: VertexInput[],
    edges: EdgeInput[],
    start: string,
    goal: string,
    stepIndex: number,
  ): Promise<AStarResult>
}
