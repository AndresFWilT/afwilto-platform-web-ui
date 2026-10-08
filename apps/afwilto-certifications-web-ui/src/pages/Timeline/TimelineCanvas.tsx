import { Link } from 'react-router-dom'
import { Card } from '@afwilto/design-system'
import type { LanedItem } from '@/domain/timeline'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

function daysInYear(y: number) {
  return isLeapYear(y) ? 366 : 365
}

function monthStartDays(year: number): number[] {
  const start = [1]
  const daysPerMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  for (let i = 0; i < 11; i++) {
    start.push(start[i] + daysPerMonth[i])
  }
  return start
}

function todayDayOfYear(year: number): number | null {
  const now = new Date()
  if (now.getFullYear() !== year) return null
  const jan1 = new Date(year, 0, 1)
  return Math.floor((now.getTime() - jan1.getTime()) / 86_400_000) + 1
}

function TimelineBar({ laned, year }: { laned: LanedItem; year: number }) {
  const { item, lane, startDay, endDay } = laned
  const color = item.category ? item.category.color : '#a78bfa'
  const total = daysInYear(year)
  const clipsLeft = startDay === 1
  const clipsRight = endDay === total

  return (
    <Link
      to={`/certifications/${item.id}`}
      aria-label={`${item.name}, ${item.category?.path ?? ''}, status: ${item.status}`}
      className="absolute flex items-center min-w-0 rounded text-white text-xs font-medium overflow-hidden
        hover:-translate-y-px transition-transform duration-150"
      style={{
        left: `${((startDay - 1) / total) * 100}%`,
        width: `${((endDay - startDay + 1) / total) * 100}%`,
        top: `${lane * 36 + 4}px`,
        height: '28px',
        backgroundColor: color + '33',
        borderLeft: clipsLeft ? `3px solid ${color}` : `2px solid ${color}`,
        borderRight: clipsRight ? `3px solid ${color}` : `1px solid ${color}44`,
        paddingLeft: '6px',
        paddingRight: '4px',
        minWidth: '20px',
      }}
    >
      <span className="truncate">{item.name}</span>
    </Link>
  )
}

function MonthHeader({ year }: { year: number }) {
  const total = daysInYear(year)
  const starts = monthStartDays(year)
  return (
    <div className="relative w-full" style={{ height: '24px', minWidth: '960px' }}>
      {MONTHS.map((name, i) => (
        <span
          key={name}
          className="absolute text-xs text-neutral-400"
          style={{ left: `${((starts[i] - 1) / total) * 100}%` }}
        >
          {name}
        </span>
      ))}
    </div>
  )
}

export function TimelineCanvas({ year, laned }: { year: number; laned: LanedItem[] }) {
  const total = daysInYear(year)
  const todayDay = todayDayOfYear(year)
  const laneCount = laned.length === 0 ? 0 : Math.max(...laned.map((l) => l.lane)) + 1
  const canvasHeight = Math.max(laneCount * 36 + 12, 60)

  return (
    <Card padding="none" className="relative overflow-hidden w-full">
      <div className="overflow-auto w-full" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ minWidth: '960px', padding: '12px 16px' }}>
          <MonthHeader year={year} />

          {todayDay && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: `calc(${((todayDay - 1) / total) * 100}% + 16px)`,
                width: '2px',
                backgroundColor: 'var(--color-cyan-400)',
                opacity: 0.7,
              }}
            />
          )}

          <div
            className="relative w-full"
            style={{ height: `${canvasHeight}px` }}
            aria-label="Timeline canvas"
          >
            {laned.map((l) => (
              <TimelineBar key={l.item.id} laned={l} year={year} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
