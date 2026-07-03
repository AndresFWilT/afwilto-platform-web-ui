import type { IHttpClient } from '@/application/ports'
import type {
  IWeatherStationService,
  SensorReading,
  WeatherSummary,
} from '@/application/ports/IWeatherStationService'

type ApiResponse<T> = { data: T }

export class WeatherStationHttpAdapter implements IWeatherStationService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async ingestReading(temperature: number, humidity: number): Promise<SensorReading> {
    try {
      const res = await this.http.post<ApiResponse<SensorReading>>(
        '/api/v1/weather-station/readings',
        { temperature, humidity },
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async queryReadings(from: string, to: string): Promise<{ readings: SensorReading[]; count: number }> {
    try {
      const res = await this.http.get<ApiResponse<{ readings: SensorReading[]; count: number }>>(
        `/api/v1/weather-station/readings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async getLatest(): Promise<SensorReading | null> {
    try {
      const res = await this.http.get<ApiResponse<SensorReading | null>>(
        '/api/v1/weather-station/readings/latest',
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async getSummary(from: string, to: string): Promise<WeatherSummary> {
    try {
      const res = await this.http.get<ApiResponse<WeatherSummary>>(
        `/api/v1/weather-station/readings/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('INVALID_TEMPERATURE')) return new Error('Temperature out of range [-50, 60]°C')
  if (m.includes('INVALID_HUMIDITY')) return new Error('Humidity out of range [0, 100]%')
  if (m.includes('INVALID_DATE_RANGE')) return new Error("'From' date must be before 'to' date")
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the backend — is network-communication-mngr running on :8086?')
  }
  return e
}
