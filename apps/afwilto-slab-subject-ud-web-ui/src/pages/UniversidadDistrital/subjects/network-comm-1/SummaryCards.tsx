import { Card, Text } from '@afwilto/design-system'
import type { WeatherSummary } from './types'

interface Props {
  summary: WeatherSummary | null
}

export function SummaryCards({ summary }: Props) {
  if (!summary) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Min Temp" value={summary.temperature.min.toFixed(1)} unit="°C" accent="primary" />
      <StatCard label="Max Temp" value={summary.temperature.max.toFixed(1)} unit="°C" accent="error" />
      <StatCard label="Min Humidity" value={summary.humidity.min.toFixed(1)} unit="%" accent="info" />
      <StatCard label="Max Humidity" value={summary.humidity.max.toFixed(1)} unit="%" accent="warning" />
      <StatCard label="Avg Temp" value={summary.temperature.avg.toFixed(1)} unit="°C" accent="neutral" />
      <StatCard label="Avg Humidity" value={summary.humidity.avg.toFixed(1)} unit="%" accent="neutral" />
      <StatCard label="Latest Temp" value={summary.temperature.latest.toFixed(1)} unit="°C" accent="primary" />
      <StatCard label="Latest Humidity" value={summary.humidity.latest.toFixed(1)} unit="%" accent="info" />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  unit: string
  accent: 'primary' | 'info' | 'error' | 'warning' | 'neutral'
}

function StatCard({ label, value, unit, accent }: StatCardProps) {
  const accentColor: Record<StatCardProps['accent'], string> = {
    primary: 'var(--color-primary-400)',
    info:    'var(--color-info-400)',
    error:   'var(--color-error-400)',
    warning: 'var(--color-warning-400)',
    neutral: 'var(--color-neutral-300)',
  }

  return (
    <Card padding="sm" className="flex flex-col gap-1">
      <Text variant="caption" color="muted">{label}</Text>
      <div className="flex items-baseline gap-1">
        <Text as="span" variant="h4" weight="bold" style={{ color: accentColor[accent] }}>
          {value}
        </Text>
        <Text as="span" variant="small" color="muted">{unit}</Text>
      </div>
    </Card>
  )
}
