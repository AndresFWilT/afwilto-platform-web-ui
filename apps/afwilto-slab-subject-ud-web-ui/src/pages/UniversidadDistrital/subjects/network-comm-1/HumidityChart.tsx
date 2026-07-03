import { Card, Text } from '@afwilto/design-system'
import type { SensorReading } from './types'

interface Props {
  readings: SensorReading[]
}

const PAD = { top: 16, right: 16, bottom: 36, left: 48 }
const W = 700
const H = 220
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom
const TICKS = 5

export function HumidityChart({ readings }: Props) {
  if (readings.length === 0) {
    return (
      <Card padding="md">
        <Text variant="small" color="muted" className="text-center italic py-6">
          No data to display
        </Text>
      </Card>
    )
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  )

  const humidities = sorted.map((r) => r.humidity)
  const rawMin     = Math.min(...humidities)
  const rawMax     = Math.max(...humidities)
  const padding    = Math.max((rawMax - rawMin) * 0.1, 1)
  const yMin       = Math.max(0, rawMin - padding)
  const yMax       = Math.min(100, rawMax + padding)

  const xMin = new Date(sorted[0].recordedAt).getTime()
  const xMax = new Date(sorted[sorted.length - 1].recordedAt).getTime()
  const xRange = xMax - xMin || 1

  const toX = (ts: string) => ((new Date(ts).getTime() - xMin) / xRange) * INNER_W
  const toY = (v: number) => INNER_H - ((v - yMin) / (yMax - yMin)) * INNER_H

  const points = sorted.map((r) => `${toX(r.recordedAt).toFixed(1)},${toY(r.humidity).toFixed(1)}`).join(' ')

  const yTickValues = Array.from({ length: TICKS }, (_, i) => yMin + (i / (TICKS - 1)) * (yMax - yMin))

  const xTickCount = Math.min(sorted.length, 5)
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i / (xTickCount - 1)) * (sorted.length - 1)),
  )

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 pt-3 pb-1">
        <Text variant="small" weight="medium" style={{ color: 'var(--color-info-400)' }}>
          Humidity (%)
        </Text>
      </div>
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ minWidth: `${W}px` }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: `${H}px` }}
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={`translate(${PAD.left},${PAD.top})`}>
              {yTickValues.map((v, i) => (
                <g key={i}>
                  <line
                    x1={0} y1={toY(v).toFixed(1)}
                    x2={INNER_W} y2={toY(v).toFixed(1)}
                    stroke="var(--color-surface-border)" strokeWidth="1"
                  />
                  <text
                    x={-8} y={toY(v)}
                    textAnchor="end" dominantBaseline="middle"
                    fontSize="10" fill="var(--color-neutral-400)"
                  >
                    {v.toFixed(1)}
                  </text>
                </g>
              ))}

              {xTickIndices.map((idx) => {
                const r = sorted[idx]
                const x = toX(r.recordedAt)
                const label = new Date(r.recordedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit',
                })
                return (
                  <g key={idx}>
                    <line
                      x1={x.toFixed(1)} y1={0}
                      x2={x.toFixed(1)} y2={INNER_H}
                      stroke="var(--color-surface-border)" strokeWidth="1" strokeDasharray="4 4"
                    />
                    <text
                      x={x} y={INNER_H + 18}
                      textAnchor="middle" fontSize="10" fill="var(--color-neutral-400)"
                    >
                      {label}
                    </text>
                  </g>
                )
              })}

              <polyline
                points={points}
                fill="none"
                stroke="var(--color-info-400)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {sorted.length <= 60 &&
                sorted.map((r, i) => (
                  <circle
                    key={i}
                    cx={toX(r.recordedAt).toFixed(1)}
                    cy={toY(r.humidity).toFixed(1)}
                    r="3"
                    fill="var(--color-info-400)"
                    stroke="var(--color-surface-raised)"
                    strokeWidth="1.5"
                  />
                ))}
            </g>
          </svg>
        </div>
      </div>
    </Card>
  )
}
