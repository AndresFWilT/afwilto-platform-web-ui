import type { Certification } from '@/application/ports'

export interface LanedItem {
  item: Certification
  lane: number
  startDay: number
  endDay: number
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

function dayOfYear(dateStr: string, year: number): number {
  const date = new Date(dateStr + 'T00:00:00')
  const jan1 = new Date(year, 0, 1)
  const ms = date.getTime() - jan1.getTime()
  return Math.floor(ms / 86_400_000) + 1
}

function resolveStartDay(cert: Certification, year: number): number | null {
  const dateStr = cert.studyStartDate ?? cert.expectedExamDate ?? cert.achievedDate
  if (!dateStr) return null
  return dayOfYear(dateStr, year)
}

function resolveEndDay(cert: Certification, year: number): number | null {
  const dateStr = cert.expectedExamDate ?? cert.studyStartDate ?? cert.achievedDate
  if (!dateStr) return null
  return dayOfYear(dateStr, year)
}

const GUTTER = 3

export function assignLanes(items: Certification[], year: number): LanedItem[] {
  const total = daysInYear(year)

  // Build candidates: only items that have at least one date AND intersect the year
  const candidates: Array<{ item: Certification; startDay: number; endDay: number }> = []

  for (const cert of items) {
    const rawStart = resolveStartDay(cert, year)
    const rawEnd = resolveEndDay(cert, year)
    if (rawStart === null && rawEnd === null) continue

    // For point items (one date only), both start and end are the same day
    const raw1 = rawStart ?? rawEnd!
    const raw2 = rawEnd ?? rawStart!

    const start = Math.min(raw1, raw2)
    const end = Math.max(raw1, raw2)

    // Exclude items entirely outside the year
    if (end < 1 || start > total) continue

    candidates.push({
      item: cert,
      startDay: Math.max(1, start),
      endDay: Math.min(total, end),
    })
  }

  // Sort by startDay, ties by id for determinism
  candidates.sort((a, b) => {
    if (a.startDay !== b.startDay) return a.startDay - b.startDay
    return a.item.id < b.item.id ? -1 : 1
  })

  // Greedy lane assignment: track the last endDay used in each lane
  const laneEnds: number[] = []
  const result: LanedItem[] = []

  for (const c of candidates) {
    let placed = false
    for (let lane = 0; lane < laneEnds.length; lane++) {
      if (laneEnds[lane] + GUTTER < c.startDay) {
        laneEnds[lane] = c.endDay
        result.push({ item: c.item, lane, startDay: c.startDay, endDay: c.endDay })
        placed = true
        break
      }
    }
    if (!placed) {
      const lane = laneEnds.length
      laneEnds.push(c.endDay)
      result.push({ item: c.item, lane, startDay: c.startDay, endDay: c.endDay })
    }
  }

  return result
}
