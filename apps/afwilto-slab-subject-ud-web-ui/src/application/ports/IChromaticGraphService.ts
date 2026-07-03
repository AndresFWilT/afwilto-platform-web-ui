// Inbound port — domain language only. No HTTP, no infrastructure.

export interface VertexColor {
  vertexId: number
  colorIndex: number
}

export interface ChromaticEstimate {
  colorsUsed: number
  vertexColors: VertexColor[]
  traversalOrder: number[]
}

export interface EstimateChromaticNumberRequest {
  adjacencyMatrix: number[][]
  startVertex?: number
  symmetrize?: boolean
}

export interface IChromaticGraphService {
  estimate(req: EstimateChromaticNumberRequest): Promise<ChromaticEstimate>
}
