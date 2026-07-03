export interface SensorReading {
  id?: number
  temperature: number
  humidity: number
  recordedAt: string
}

export interface ReadingSummary {
  min: number
  max: number
  avg: number
  latest: number
}

export interface WeatherSummary {
  temperature: ReadingSummary
  humidity: ReadingSummary
  count: number
  from: string
  to: string
}

export interface IWeatherStationService {
  ingestReading(temperature: number, humidity: number): Promise<SensorReading>
  queryReadings(from: string, to: string): Promise<{ readings: SensorReading[]; count: number }>
  getLatest(): Promise<SensorReading | null>
  getSummary(from: string, to: string): Promise<WeatherSummary>
}
