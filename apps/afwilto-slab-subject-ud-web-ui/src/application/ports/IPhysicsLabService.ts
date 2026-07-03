export interface PointStatistics {
  index: number
  mean: number
  standardDeviation: number
  accidentalError: number
  absoluteError: number
}

export interface ErrorAnalysisResult {
  points: PointStatistics[]
}

export interface PropagatedValue {
  value: number
  uncertainty: number
}

export interface DataPoint {
  x: number
  y: number
}

export interface Summations {
  n: number
  sx: number
  sy: number
  sxy: number
  sxx: number
  syy: number
}

export interface RegressionLine {
  slope: number
  intercept: number
  correlationCoefficient: number
  chiSquared: number
  slopeDeviation: number
  interceptDeviation: number
}

export interface RegressionTableRow {
  xi: number
  yi: number
  xiYi: number
  xiSquared: number
  yiSquared: number
  chiSquaredTerm: number
}

export interface RegressionResult {
  table: RegressionTableRow[]
  summations: Summations
  regression: RegressionLine
  linearizationExponent: number
}

export interface UnitGroup {
  category: string
  units: string[]
}

export type PropagationOperation = 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE'

export interface IPhysicsLabService {
  analyzeMeasurements(
    measurements: number[][],
    scaleError: number,
    significantFigures: number
  ): Promise<ErrorAnalysisResult>

  convertUnits(
    measurements: number[][],
    fromUnit: string,
    toUnit: string
  ): Promise<number[][]>

  propagateError(
    xValues: number[],
    yValues: number[],
    xError: number,
    yError: number,
    operation: PropagationOperation
  ): Promise<PropagatedValue[]>

  computeRegression(
    dataPoints: DataPoint[],
    linearizationExponent: number,
    significantFigures: number
  ): Promise<RegressionResult>

  getAvailableUnits(): Promise<UnitGroup[]>
}
