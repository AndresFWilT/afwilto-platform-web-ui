import type { IHttpClient } from '@/application/ports'
import type {
  IPhysicsLabService,
  ErrorAnalysisResult,
  PropagatedValue,
  PropagationOperation,
  RegressionResult,
  DataPoint,
  UnitGroup,
} from '@/application/ports/IPhysicsLabService'

type ApiResponse<T> = { data: T }

export class PhysicsLabHttpAdapter implements IPhysicsLabService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async analyzeMeasurements(
    measurements: number[][],
    scaleError: number,
    significantFigures: number
  ): Promise<ErrorAnalysisResult> {
    try {
      const res = await this.http.post<ApiResponse<ErrorAnalysisResult>>(
        '/api/v1/lab/analyze',
        { measurements, scaleError, significantFigures }
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async convertUnits(
    measurements: number[][],
    fromUnit: string,
    toUnit: string
  ): Promise<number[][]> {
    try {
      const res = await this.http.post<ApiResponse<{ measurements: number[][] }>>(
        '/api/v1/lab/convert',
        { measurements, fromUnit, toUnit }
      )
      return res.data.measurements
    } catch (e) { throw translate(e) }
  }

  async propagateError(
    xValues: number[],
    yValues: number[],
    xError: number,
    yError: number,
    operation: PropagationOperation
  ): Promise<PropagatedValue[]> {
    try {
      const res = await this.http.post<ApiResponse<{ results: PropagatedValue[] }>>(
        '/api/v1/lab/propagate',
        { xValues, yValues, xError, yError, operation }
      )
      return res.data.results
    } catch (e) { throw translate(e) }
  }

  async computeRegression(
    dataPoints: DataPoint[],
    linearizationExponent: number,
    significantFigures: number
  ): Promise<RegressionResult> {
    try {
      const res = await this.http.post<ApiResponse<RegressionResult>>(
        '/api/v1/lab/regression',
        { dataPoints, linearizationExponent, significantFigures }
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async getAvailableUnits(): Promise<UnitGroup[]> {
    try {
      const res = await this.http.get<ApiResponse<UnitGroup[]>>('/api/v1/lab/units')
      return res.data
    } catch (e) { throw translate(e) }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('INVALID_MEASUREMENTS')) return new Error('Measurements must have at least 1 row and 2 columns')
  if (m.includes('UNKNOWN_CONVERSION'))   return new Error('Unknown unit conversion pair')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the physics service — is physics-mngr running on :8087?')
  }
  return e
}
