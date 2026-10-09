import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// The shell and this remote ship separate Tailwind builds on one page, so a
// base utility and its responsive override (`hidden lg:block`, `flex-col
// sm:flex-row`, `grid-cols-1 md:grid-cols-2`) tie on specificity and the other
// build can win by stylesheet order (Slice 09b amendment). Layout that changes
// with the viewport is decided in JS (useMediaQuery) instead.
const SRC = path.resolve(__dirname, '../src')
const FAMILIES: Array<[string, RegExp]> = [
  ['display', /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden|contents|table)$/],
  ['flex-direction', /^flex-(row|col)(-reverse)?$/],
  ['grid-template-columns', /^grid-cols-/],
]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full) : /\.tsx$/.test(name) ? [full] : []
  })
}

function conflicts(classList: string): string[] {
  const tokens = classList.split(/\s+/).filter(Boolean)
  const found: string[] = []
  for (const [family, re] of FAMILIES) {
    const base = tokens.filter((t) => re.test(t))
    const responsive = tokens.filter((t) => /^(sm|md|lg|xl|2xl):/.test(t) && re.test(t.split(':').pop()!))
    if (base.length && responsive.length) found.push(`${family}: ${[...base, ...responsive].join(' ')}`)
  }
  return found
}

describe('no base + responsive utility pairs on one property (two Tailwind builds)', () => {
  it('the detector catches the known bad shapes', () => {
    expect(conflicts('hidden lg:block')).toHaveLength(1)
    expect(conflicts('flex flex-col sm:flex-row')).toHaveLength(1)
    expect(conflicts('grid grid-cols-1 md:grid-cols-2')).toHaveLength(1)
    expect(conflicts('flex gap-2 md:col-span-2 hover:flex')).toHaveLength(0)
  })

  it('no className literal in src pairs them', () => {
    const offenders = files(SRC).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      const literals = [...text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)].map((m) => m[1] ?? m[2] ?? m[3])
      return literals.flatMap((l) => conflicts(l).map((c) => `${path.relative(SRC, file)}: ${c}`))
    })
    expect(offenders).toEqual([])
  })
})
