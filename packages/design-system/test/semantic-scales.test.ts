import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { colors } from '../src'

// vitest runs with the package directory as root/cwd
const stylesCss = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf-8')

describe('semantic colour scales (AC-1, design-system-migration spec)', () => {
  it('exports success/warning/error scales with steps 300–700', () => {
    for (const scale of ['success', 'warning', 'error'] as const) {
      for (const step of [300, 400, 500, 600, 700] as const) {
        expect(colors[scale][step], `colors.${scale}[${step}]`).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    }
  })

  it('exports info scale with steps 300–700', () => {
    for (const step of [300, 400, 500, 600, 700] as const) {
      expect(colors.info[step], `colors.info[${step}]`).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('exports the neutral scale 100–900', () => {
    for (const step of [100, 200, 300, 400, 500, 600, 700, 800, 900] as const) {
      expect(colors.neutral[step], `colors.neutral[${step}]`).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('keeps the legacy flat semantic export unchanged', () => {
    expect(colors.semantic).toEqual({
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
    })
  })

  it('scale 500 steps agree with the flat semantic values', () => {
    expect(colors.success[500]).toBe(colors.semantic.success)
    expect(colors.warning[500]).toBe(colors.semantic.warning)
    expect(colors.error[500]).toBe(colors.semantic.error)
    expect(colors.info[500]).toBe(colors.semantic.info)
  })

  it('declares the new 600/700 theme vars in styles.css', () => {
    for (const name of [
      '--color-success-600',
      '--color-success-700',
      '--color-warning-600',
      '--color-warning-700',
      '--color-error-600',
      '--color-error-700',
      '--color-info-600',
      '--color-info-700',
    ]) {
      expect(stylesCss).toContain(name)
    }
  })
})
