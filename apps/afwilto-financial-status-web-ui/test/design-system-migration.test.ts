import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// vitest runs with the app directory as root/cwd
const appRoot = process.cwd()

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(tsx?|css)$/.test(entry) ? [full] : []
  })
}

const files = sourceFiles(join(appRoot, 'src'))
const indexCss = readFileSync(join(appRoot, 'src/index.css'), 'utf-8')
const pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf-8'))

describe('dependency & CSS wiring (AC-2)', () => {
  it('depends on @afwilto/design-system via workspace protocol', () => {
    expect(pkg.dependencies['@afwilto/design-system']).toBe('workspace:*')
  })

  it('index.css imports the shared stylesheet and registers its @source', () => {
    expect(indexCss).toContain('@import "@afwilto/design-system/styles.css"')
    expect(indexCss).toContain('@source "../../../packages/design-system/src"')
  })

  it('index.css keeps only domain aliases in @theme (no bespoke palette)', () => {
    expect(indexCss).not.toMatch(/--color-dark-\d/)
    expect(indexCss).not.toMatch(/--color-purple-\d/)
    expect(indexCss).not.toMatch(/--color-text-/)
    expect(indexCss).not.toContain('#00fff0')
    expect(indexCss).toMatch(/--color-income-500:\s*var\(--color-success-500\)/)
    expect(indexCss).toMatch(/--color-expense-500:\s*var\(--color-error-500\)/)
  })
})

describe('no legacy design vocabulary in src/ (AC-3)', () => {
  const banned: Array<[string, RegExp]> = [
    ['dark-N utility classes', /\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|to|via)-dark-\d/],
    ['purple-N utility classes', /\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|to|via)-purple-\d/],
    ['text-text-* classes', /\btext-text-(?:primary|secondary|muted|disabled)\b/],
    ['border-border class', /\bborder-border\b/],
    ['glow utilities', /\b(?:text-)?glow-(?:primary|purple)\b/],
    ['legacy neon/black hexes', /#(?:00fff0|a855f7|0a0a0a|1a1a1a|111111)\b/i],
  ]

  for (const file of files) {
    const rel = file.slice(appRoot.length)
    it(`${rel} is free of legacy tokens`, () => {
      const content = readFileSync(file, 'utf-8')
      for (const [label, pattern] of banned) {
        expect(content, `${rel} contains ${label}`).not.toMatch(pattern)
      }
    })
  }
})
