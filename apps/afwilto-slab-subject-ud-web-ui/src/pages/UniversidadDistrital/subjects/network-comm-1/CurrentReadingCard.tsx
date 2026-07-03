import { Card, Text, Badge, Spinner } from '@afwilto/design-system'
import type { SensorReading } from './types'

interface Props {
  reading: SensorReading | null
  loading: boolean
}

export function CurrentReadingCard({ reading, loading }: Props) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <Text as="h3" variant="h4" color="muted">
        Current Reading
      </Text>

      {loading && !reading && (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      )}

      {!loading && !reading && (
        <Text variant="body" color="muted" className="italic">
          No readings yet
        </Text>
      )}

      {reading && (
        <>
          <div className="flex gap-6 flex-wrap">
            <div className="flex flex-col gap-1">
              <Text variant="small" color="muted">Temperature</Text>
              <div className="flex items-baseline gap-2">
                <Text as="span" variant="h2" weight="bold" style={{ color: 'var(--color-primary-400)' }}>
                  {reading.temperature.toFixed(1)}
                </Text>
                <Text as="span" variant="body" color="muted">°C</Text>
                <Badge variant={temperatureBadge(reading.temperature)} size="sm">
                  {temperatureLabel(reading.temperature)}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Text variant="small" color="muted">Humidity</Text>
              <div className="flex items-baseline gap-2">
                <Text as="span" variant="h2" weight="bold" style={{ color: 'var(--color-info-400)' }}>
                  {reading.humidity.toFixed(1)}
                </Text>
                <Text as="span" variant="body" color="muted">%</Text>
                <Badge variant={humidityBadge(reading.humidity)} size="sm">
                  {humidityLabel(reading.humidity)}
                </Badge>
              </div>
            </div>
          </div>

          <Text variant="caption" color="muted">
            Recorded at {formatTimestamp(reading.recordedAt)}
          </Text>
        </>
      )}
    </Card>
  )
}

function temperatureBadge(t: number): 'primary' | 'success' | 'warning' | 'error' {
  if (t < 10) return 'primary'
  if (t <= 25) return 'success'
  if (t <= 35) return 'warning'
  return 'error'
}

function temperatureLabel(t: number): string {
  if (t < 10) return 'Cold'
  if (t <= 25) return 'Normal'
  if (t <= 35) return 'Warm'
  return 'Hot'
}

function humidityBadge(h: number): 'success' | 'warning' | 'error' {
  if (h <= 70) return 'success'
  if (h <= 85) return 'warning'
  return 'error'
}

function humidityLabel(h: number): string {
  if (h <= 70) return 'OK'
  if (h <= 85) return 'High'
  return 'Very High'
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
