import { Card, Text } from '@afwilto/design-system'
import type { MLFQExecutionStep } from './types'
import { QUEUE_COLORS } from './types'

interface Props {
  steps: MLFQExecutionStep[]
  totalTime: number
}

const PX_PER_UNIT = 28
const BAR_H = 36
const LABEL_H = 20
const SVG_H = BAR_H + LABEL_H + 8

export function GanttChart({ steps, totalTime }: Props) {
  if (steps.length === 0) return null

  const visibleSteps = steps.filter(s => s.action !== 'IDLE')
  const width = Math.max(totalTime * PX_PER_UNIT, 300)

  return (
    <div className="flex flex-col gap-2">
      <Text variant="small" weight="semibold" color="default">Gantt Chart</Text>
      <Card
        padding="none"
        className="relative overflow-hidden w-full"
        style={{ height: SVG_H + 16, backgroundColor: 'var(--color-brand-50)' }}
      >
        <div className="overflow-auto w-full h-full" style={{ scrollbarWidth: 'thin' }}>
          <div style={{ minWidth: width + 32, height: '100%', paddingLeft: 8, paddingRight: 8, paddingTop: 8 }}>
            <svg width={width} height={SVG_H} style={{ display: 'block' }}>
              {visibleSteps.map((step, i) => {
                const x = step.time * PX_PER_UNIT
                const w = step.timeUsed * PX_PER_UNIT
                const color = QUEUE_COLORS[step.queueLevel]
                return (
                  <g key={i}>
                    <rect x={x} y={0} width={w} height={BAR_H} rx={3}
                      fill={`${color}55`} stroke={color} strokeWidth={1.5} />
                    {w >= 18 && (
                      <text x={x + w / 2} y={BAR_H / 2 + 1} textAnchor="middle"
                        dominantBaseline="middle" fill={color}
                        fontSize="9" fontFamily="monospace" fontWeight="bold">
                        P{step.pid}
                      </text>
                    )}
                  </g>
                )
              })}

              {buildMarkers(visibleSteps, totalTime).map(t => (
                <g key={t}>
                  <line x1={t * PX_PER_UNIT} y1={BAR_H} x2={t * PX_PER_UNIT} y2={BAR_H + 6}
                    stroke="rgba(24,29,53,0.4)" strokeWidth={1} />
                  <text x={t * PX_PER_UNIT} y={BAR_H + 17} textAnchor="middle"
                    fill="rgba(24,29,53,0.6)" fontSize="8" fontFamily="monospace">
                    {t}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {(['RoundRobin', 'ShortestJobFirst', 'FirstComeFirstServed'] as const).map(l => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: QUEUE_COLORS[l] }} />
            <Text variant="caption" color="muted">{l === 'RoundRobin' ? 'RR' : l === 'ShortestJobFirst' ? 'SJF' : 'FCFS'}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildMarkers(steps: MLFQExecutionStep[], totalTime: number): number[] {
  const times = new Set<number>([0, totalTime])
  steps.forEach(s => { times.add(s.time); times.add(s.time + s.timeUsed) })
  return Array.from(times).sort((a, b) => a - b)
}
