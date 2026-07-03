import { Card, Text } from '@afwilto/design-system'
import type { GraphicalSolution, GraphicalConstraint } from './types'

interface Props {
  solution: GraphicalSolution
  constraints: GraphicalConstraint[]
}

const W = 560
const H = 460
const PAD = { top: 20, right: 40, bottom: 50, left: 55 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

const LINE_COLORS = ['#f97316', '#a855f7', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export function FeasibleRegionChart({ solution, constraints }: Props) {
  // Compute chart bounds from all meaningful points
  const allX = [
    0,
    ...solution.feasibleVertices.map(p => p.x),
    ...solution.intersections.filter(i => i.feasible).map(i => i.point.x),
    ...solution.constraintLines.flatMap(l => [l.xIntercept ?? 0]).filter(v => v > 0 && isFinite(v)),
  ]
  const allY = [
    0,
    ...solution.feasibleVertices.map(p => p.y),
    ...solution.intersections.filter(i => i.feasible).map(i => i.point.y),
    ...solution.constraintLines.flatMap(l => [l.yIntercept ?? 0]).filter(v => v > 0 && isFinite(v)),
  ]

  const xMax = Math.max(...allX.filter(isFinite), 1) * 1.3
  const yMax = Math.max(...allY.filter(isFinite), 1) * 1.3

  const toX = (x: number) => PAD.left + (x / xMax) * IW
  const toY = (y: number) => H - PAD.bottom - (y / yMax) * IH

  const xTicks = niceTicks(0, xMax, 5)
  const yTicks = niceTicks(0, yMax, 5)

  const polygonPoints = solution.feasibleVertices
    .map(p => `${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`)
    .join(' ')

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-4 pt-3 pb-1 flex items-center gap-3 flex-wrap">
        <Text variant="small" weight="medium" color="muted">Feasible Region</Text>
        <div className="flex gap-3 flex-wrap">
          {constraints.map((_, i) => (
            <span key={i} className="flex items-center gap-1 text-xs" style={{ color: LINE_COLORS[i % LINE_COLORS.length] }}>
              <span className="inline-block w-4 h-0.5" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
              R{i + 1}
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            Optimal
          </span>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ minWidth: `${W}px` }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H }}>
            {/* Grid */}
            {xTicks.map(x => (
              <line key={`gx${x}`} x1={toX(x).toFixed(1)} y1={PAD.top}
                x2={toX(x).toFixed(1)} y2={H - PAD.bottom}
                stroke="var(--color-surface-border)" strokeWidth="1" strokeDasharray="3 3" />
            ))}
            {yTicks.map(y => (
              <line key={`gy${y}`} x1={PAD.left} y1={toY(y).toFixed(1)}
                x2={W - PAD.right} y2={toY(y).toFixed(1)}
                stroke="var(--color-surface-border)" strokeWidth="1" strokeDasharray="3 3" />
            ))}

            {/* Axes */}
            <line x1={toX(0)} y1={PAD.top} x2={toX(0)} y2={H - PAD.bottom}
              stroke="var(--color-neutral-400)" strokeWidth="1.5" />
            <line x1={PAD.left} y1={toY(0)} x2={W - PAD.right} y2={toY(0)}
              stroke="var(--color-neutral-400)" strokeWidth="1.5" />
            <text x={W - PAD.right + 6} y={toY(0)} dominantBaseline="middle" fontSize="11" fill="var(--color-neutral-400)">x</text>
            <text x={toX(0)} y={PAD.top - 6} textAnchor="middle" fontSize="11" fill="var(--color-neutral-400)">y</text>

            {/* Tick labels */}
            {xTicks.map(x => x > 0 && (
              <text key={`lx${x}`} x={toX(x)} y={H - PAD.bottom + 16}
                textAnchor="middle" fontSize="10" fill="var(--color-neutral-400)">
                {fmtTick(x)}
              </text>
            ))}
            {yTicks.map(y => y > 0 && (
              <text key={`ly${y}`} x={PAD.left - 8} y={toY(y)}
                textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--color-neutral-400)">
                {fmtTick(y)}
              </text>
            ))}

            {/* Feasible region */}
            {solution.feasibleVertices.length >= 3 && (
              <polygon points={polygonPoints}
                fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.35)" strokeWidth="1" />
            )}

            {/* Constraint lines */}
            {constraints.map((c, i) => {
              const pts = constraintEndpoints(c, xMax, yMax)
              if (pts.length < 2) return null
              const color = LINE_COLORS[i % LINE_COLORS.length]
              const mx = (toX(pts[0][0]) + toX(pts[1][0])) / 2
              const my = (toY(pts[0][1]) + toY(pts[1][1])) / 2
              return (
                <g key={i}>
                  <line x1={toX(pts[0][0]).toFixed(1)} y1={toY(pts[0][1]).toFixed(1)}
                    x2={toX(pts[1][0]).toFixed(1)} y2={toY(pts[1][1]).toFixed(1)}
                    stroke={color} strokeWidth="1.5" />
                  <text x={mx + 4} y={my - 6} fontSize="10" fill={color} fontWeight="600">R{i + 1}</text>
                </g>
              )
            })}

            {/* All intersection points */}
            {solution.intersections.map((inter, i) => {
              const cx = toX(inter.point.x)
              const cy = toY(inter.point.y)
              if (cx < PAD.left - 4 || cx > W - PAD.right + 4) return null
              if (cy < PAD.top - 4 || cy > H - PAD.bottom + 4) return null
              return inter.feasible ? (
                <circle key={i} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r="3.5"
                  fill="var(--color-neutral-100)" stroke="var(--color-primary-400)" strokeWidth="1.5" />
              ) : (
                <circle key={i} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r="2.5"
                  fill="none" stroke="var(--color-neutral-600)" strokeWidth="1" />
              )
            })}

            {/* Optimal point */}
            {solution.optimalPoint && (() => {
              const ox = toX(solution.optimalPoint.x)
              const oy = toY(solution.optimalPoint.y)
              const labelRight = ox < W * 0.65
              return (
                <g>
                  <circle cx={ox.toFixed(1)} cy={oy.toFixed(1)} r="6"
                    fill="var(--color-success-400)" stroke="white" strokeWidth="2" />
                  <text x={labelRight ? ox + 10 : ox - 10} y={oy - 10}
                    textAnchor={labelRight ? 'start' : 'end'} fontSize="11"
                    fill="var(--color-success-400)" fontWeight="600">
                    ({solution.optimalPoint.x.toFixed(2)}, {solution.optimalPoint.y.toFixed(2)})
                  </text>
                  <text x={labelRight ? ox + 10 : ox - 10} y={oy + 3}
                    textAnchor={labelRight ? 'start' : 'end'} fontSize="10"
                    fill="var(--color-neutral-300)">
                    Z* = {solution.optimalValue?.toFixed(2)}
                  </text>
                </g>
              )
            })()}
          </svg>
        </div>
      </div>
    </Card>
  )
}

function constraintEndpoints(c: GraphicalConstraint, xMax: number, yMax: number): [number, number][] {
  const [a, b] = c.coefficients
  const rhs = c.rhs
  const pts: [number, number][] = []
  const EPS = 1e-9

  if (Math.abs(b) > EPS) {
    // y = (rhs - a*x) / b
    const at0: [number, number] = [0, rhs / b]
    const atXmax: [number, number] = [xMax, (rhs - a * xMax) / b]
    const atYmax: [number, number] = [Math.abs(a) > EPS ? (rhs - b * yMax) / a : 0, yMax]
    const at0y: [number, number] = [Math.abs(a) > EPS ? rhs / a : 0, 0]
    for (const p of [at0, atXmax, atYmax, at0y]) {
      if (p[0] >= -0.01 && p[0] <= xMax * 1.01 && p[1] >= -0.01 && p[1] <= yMax * 1.01) {
        pts.push(p)
      }
    }
  } else if (Math.abs(a) > EPS) {
    // vertical: x = rhs/a
    const x0 = rhs / a
    if (x0 >= 0 && x0 <= xMax) {
      pts.push([x0, 0])
      pts.push([x0, yMax])
    }
  }

  if (pts.length < 2) return []
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1])
  return [pts[0], pts[pts.length - 1]]
}

function niceTicks(min: number, max: number, count: number): number[] {
  const range = max - min || 1
  const rawStep = range / count
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const frac = rawStep / mag
  const step = frac < 1.5 ? mag : frac < 3 ? 2 * mag : frac < 7 ? 5 * mag : 10 * mag
  const start = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let t = start; t <= max + step * 0.01; t += step) {
    ticks.push(Math.round(t * 1e9) / 1e9)
  }
  return ticks
}

function fmtTick(v: number): string {
  if (v % 1 === 0) return String(v)
  if (Math.abs(v) < 100) return v.toFixed(1)
  return v.toFixed(0)
}
