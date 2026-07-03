export type { SensorReading, ReadingSummary, WeatherSummary } from '@/application/ports/IWeatherStationService'

export interface DateRange {
  from: string
  to: string
}
