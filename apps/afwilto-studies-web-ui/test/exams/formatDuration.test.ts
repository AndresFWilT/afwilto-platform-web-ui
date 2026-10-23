import { describe, it, expect } from 'vitest'
import { formatDuration } from '../../src/shared/lib/format'

describe('formatDuration', () => {
  it('shows seconds under a minute', () => {
    expect(formatDuration(0)).toBe('0 s')
    expect(formatDuration(45)).toBe('45 s')
  })

  it('shows whole minutes, with the seconds only when there are some', () => {
    expect(formatDuration(1800)).toBe('30 min')
    expect(formatDuration(90)).toBe('1 min 30 s')
  })

  it('shows hours and minutes from one hour on, dropping the seconds', () => {
    expect(formatDuration(3600)).toBe('1 h')
    expect(formatDuration(7800)).toBe('2 h 10 min')
    expect(formatDuration(7830)).toBe('2 h 10 min')
  })

  it('treats a negative duration as zero', () => {
    expect(formatDuration(-5)).toBe('0 s')
  })
})
