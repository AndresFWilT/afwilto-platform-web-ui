/**
 * Pure-logic tests for timeline domain functions (Slice 08).
 * All tests are RED until assignLanes is implemented.
 */
import { describe, it, expect } from 'vitest'
import { assignLanes, type LanedItem } from '../src/domain/timeline/assignLanes'

// ── Helpers ────────────────────────────────────────────────────────────────

function item(
  id: string,
  start: string | null,
  end: string | null,
  categoryId = 'cat-1',
) {
  return {
    id,
    name: id,
    status: 'planned' as const,
    category: { id: categoryId, path: 'Test', normalizedPath: 'test', color: '#22D3EE' },
    studyStartDate: start ?? undefined,
    expectedExamDate: end ?? undefined,
    achievedDate: undefined,
    notes: undefined,
    evidenceUrl: undefined,
    attachments: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

// ── assignLanes ─────────────────────────────────────────────────────────────

describe('assignLanes', () => {
  it('returns empty array for empty input', () => {
    expect(assignLanes([], 2026)).toEqual([])
  })

  it('returns empty for all-unscheduled items (no dates)', () => {
    const items = [item('a', null, null), item('b', null, null)]
    expect(assignLanes(items, 2026)).toEqual([])
  })

  it('places a single item in lane 0', () => {
    const result = assignLanes([item('a', '2026-03-01', '2026-06-30')], 2026)
    expect(result).toHaveLength(1)
    expect(result[0].lane).toBe(0)
    expect(result[0].item.id).toBe('a')
  })

  it('AC-T9 / AC-T2: two non-overlapping items share lane 0', () => {
    const a = item('a', '2026-01-01', '2026-03-31')
    const b = item('b', '2026-07-01', '2026-09-30')
    const result = assignLanes([a, b], 2026)
    expect(result.map((r) => r.lane)).toEqual([0, 0])
  })

  it('AC-T2: overlapping items get different lanes', () => {
    const a = item('a', '2026-08-01', '2026-11-15')
    const b = item('b', '2026-10-01', '2026-12-31')
    const result = assignLanes([a, b], 2026)
    const lanes = result.map((r) => r.lane)
    expect(lanes[0]).not.toBe(lanes[1])
  })

  it('nested ranges (b fully inside a) get different lanes', () => {
    const a = item('a', '2026-01-01', '2026-12-31')
    const b = item('b', '2026-04-01', '2026-06-30')
    const result = assignLanes([a, b], 2026)
    expect(result[0].lane).not.toBe(result[1].lane)
  })

  it('identical ranges get different lanes', () => {
    const a = item('a', '2026-05-01', '2026-08-31')
    const b = item('b', '2026-05-01', '2026-08-31')
    const result = assignLanes([a, b], 2026)
    expect(result[0].lane).not.toBe(result[1].lane)
  })

  it('3-day gutter: b starting 2 days after a ends goes in a different lane', () => {
    const a = item('a', '2026-01-01', '2026-06-01')
    // b starts 2 days after a ends — within the 3-day gutter, should be different lane
    const b = item('b', '2026-06-03', '2026-12-31')
    const result = assignLanes([a, b], 2026)
    expect(result[0].lane).not.toBe(result[1].lane)
  })

  it('3-day gutter: b starting 4 days after a ends fits in the same lane', () => {
    const a = item('a', '2026-01-01', '2026-06-01')
    // b starts 4 days after a ends — outside the gutter, can share lane 0
    const b = item('b', '2026-06-05', '2026-12-31')
    const result = assignLanes([a, b], 2026)
    expect(result[0].lane).toBe(result[1].lane)
  })

  it('point item (only expectedExamDate): span is startDay === endDay', () => {
    const a = item('a', null, '2026-07-15')
    const result = assignLanes([a], 2026)
    expect(result).toHaveLength(1)
    expect(result[0].startDay).toBe(result[0].endDay)
  })

  it('point item (only studyStartDate): span is startDay === endDay', () => {
    const a = item('a', '2026-09-01', null)
    const result = assignLanes([a], 2026)
    expect(result).toHaveLength(1)
    expect(result[0].startDay).toBe(result[0].endDay)
  })

  it('year-edge clipping: item starting before the year clips to day 1', () => {
    const a = item('a', '2025-10-01', '2026-03-31')
    const result = assignLanes([a], 2026)
    expect(result[0].startDay).toBe(1)
    expect(result[0].endDay).toBeGreaterThan(1)
  })

  it('year-edge clipping: item ending after the year clips to last day of year', () => {
    const a = item('a', '2026-09-01', '2027-03-31')
    const daysInYear = 365 // 2026 is not a leap year
    const result = assignLanes([a], 2026)
    expect(result[0].endDay).toBe(daysInYear)
  })

  it('leap year 2028: last day is 366', () => {
    const a = item('a', '2028-01-01', '2028-12-31')
    const result = assignLanes([a], 2028)
    expect(result[0].endDay).toBe(366)
  })

  it('item entirely outside the year is excluded', () => {
    const outside = item('x', '2025-01-01', '2025-12-31')
    const inside = item('a', '2026-06-01', '2026-09-30')
    const result = assignLanes([outside, inside], 2026)
    expect(result).toHaveLength(1)
    expect(result[0].item.id).toBe('a')
  })

  it('is deterministic (same input → same output on repeated calls)', () => {
    const items = [
      item('b', '2026-03-01', '2026-08-31'),
      item('a', '2026-01-01', '2026-06-30'),
      item('c', '2026-05-01', '2026-12-31'),
    ]
    const r1 = assignLanes(items, 2026)
    const r2 = assignLanes(items, 2026)
    expect(r1.map((x) => `${x.item.id}:${x.lane}`)).toEqual(
      r2.map((x) => `${x.item.id}:${x.lane}`),
    )
  })

  it('tiebreak by id: identical ranges → stable lane assignment', () => {
    const a = item('aaa', '2026-05-01', '2026-08-31')
    const b = item('bbb', '2026-05-01', '2026-08-31')
    const r1 = assignLanes([a, b], 2026)
    const r2 = assignLanes([b, a], 2026)
    // Same id should always get the same lane regardless of input order
    const laneA1 = r1.find((x) => x.item.id === 'aaa')!.lane
    const laneA2 = r2.find((x) => x.item.id === 'aaa')!.lane
    expect(laneA1).toBe(laneA2)
  })

  it('AC-T9: stress — 10 fully-overlapping items use 10 different lanes', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      item(`item-${i}`, '2026-03-01', '2026-09-30'),
    )
    const result = assignLanes(items, 2026)
    const laneSet = new Set(result.map((r) => r.lane))
    expect(laneSet.size).toBe(10)
  })

  it('returns correct LanedItem shape', () => {
    const result = assignLanes([item('a', '2026-06-01', '2026-09-30')], 2026)
    const r = result[0] as LanedItem
    expect(r).toHaveProperty('item')
    expect(r).toHaveProperty('lane')
    expect(r).toHaveProperty('startDay')
    expect(r).toHaveProperty('endDay')
    expect(typeof r.lane).toBe('number')
    expect(typeof r.startDay).toBe('number')
    expect(typeof r.endDay).toBe('number')
  })
})
