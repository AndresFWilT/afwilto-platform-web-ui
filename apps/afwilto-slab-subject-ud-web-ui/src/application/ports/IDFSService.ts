export type DFSAction = 'VISITED' | 'GOAL_FOUND' | 'BACKTRACKED'

export interface DFSStep {
  vertexId: string
  action: DFSAction
  stackState: string[]
  visitedSet: string[]
}

export interface DFSResult {
  traversalOrder: string[]
  pathToGoal: string[] | null
  steps: DFSStep[]
  verticesVisited: number
}

export interface IDFSService {
  solve(
    adjacency: Record<string, string[]>,
    start: string,
    goal?: string,
  ): Promise<DFSResult>

  step(
    adjacency: Record<string, string[]>,
    start: string,
    stepIndex: number,
    goal?: string,
  ): Promise<DFSResult>
}
