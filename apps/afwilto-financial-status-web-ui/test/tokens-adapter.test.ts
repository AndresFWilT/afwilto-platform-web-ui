import { describe, it, expect } from 'vitest'
import { colors } from '../src/tokens'
import { colors as ds } from '@afwilto/design-system'

describe('chart palette adapter (AC-4)', () => {
  it('income derives from the shared success scale', () => {
    expect(colors.income[400]).toBe(ds.success[400])
    expect(colors.income[500]).toBe(ds.success[500])
  })

  it('expense derives from the shared error scale', () => {
    expect(colors.expense[400]).toBe(ds.error[400])
    expect(colors.expense[500]).toBe(ds.error[500])
  })

  it('warning derives from the shared warning scale', () => {
    expect(colors.warning[400]).toBe(ds.warning[400])
    expect(colors.warning[500]).toBe(ds.warning[500])
  })

  it('primary and info derive from the shared accent scales', () => {
    expect(colors.primary[400]).toBe(ds.primary[400])
    expect(colors.info[500]).toBe(ds.info[500])
  })

  it('surfaces, border and text derive from shared surface/neutral tokens', () => {
    expect(colors.surface).toEqual(ds.surface)
    expect(colors.border).toBe(ds.surface.border)
    expect(colors.text.primary).toBe(ds.neutral[100])
    expect(colors.text.secondary).toBe(ds.neutral[400])
    expect(colors.text.muted).toBe(ds.neutral[500])
  })

  it('exposes no legacy purple/dark keys', () => {
    expect(colors).not.toHaveProperty('purple')
    expect(colors).not.toHaveProperty('dark')
  })
})
