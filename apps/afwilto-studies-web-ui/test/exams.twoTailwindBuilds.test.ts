import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// The shell and this remote ship separate Tailwind builds on one page, so a base utility and its
// responsive override (`hidden lg:block`, `flex-col sm:flex-row`, `grid-cols-1 md:grid-cols-2`) tie
// on specificity and the other build can win by stylesheet order. Copied from
// apps/afwilto-cidr-web-ui/test/twoTailwindBuilds.test.ts and scoped to the new exams area
// (Spec 18 slice 07; the legacy suite is covered by test/twoTailwindBuilds.test.ts).
const SRC = path.resolve(__dirname, '../src')
const LEGACY_FEATURES = ['editor', 'markdown']
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

function inNewArea(rel: string): boolean {
  const [top, second] = rel.split('/')
  return top === 'exams' || top === 'shared' || (top === 'features' && !LEGACY_FEATURES.includes(second))
}

export function conflicts(classList: string): string[] {
  const tokens = classList.split(/\s+/).filter(Boolean)
  const found: string[] = []
  for (const [family, re] of FAMILIES) {
    const base = tokens.filter((t) => re.test(t))
    const responsive = tokens.filter((t) => /^(sm|md|lg|xl|2xl):/.test(t) && re.test(t.split(':').pop()!))
    if (base.length && responsive.length) found.push(`${family}: ${[...base, ...responsive].join(' ')}`)
  }
  return found
}

/** className="…", className={'…'} and className={`…`}, plus the string literals of template parts. */
export function classLiterals(text: string): string[] {
  return [...text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g)].map((m) => m[1] ?? m[2] ?? m[3])
}

describe('no base + responsive utility pairs in the exams area (two Tailwind builds)', () => {
  it('the detector catches the known bad shapes', () => {
    expect(conflicts('hidden lg:block')).toHaveLength(1)
    expect(conflicts('flex flex-col sm:flex-row')).toHaveLength(1)
    expect(conflicts('grid grid-cols-1 md:grid-cols-2')).toHaveLength(1)
    expect(conflicts('flex gap-2 md:col-span-2 hover:flex')).toHaveLength(0)
  })

  it('the intrinsic layouts of the templates are not pairs', () => {
    expect(conflicts('flex flex-wrap items-start gap-4')).toHaveLength(0)
    expect(conflicts('flex basis-[28rem] grow flex-col gap-3')).toHaveLength(0)
    expect(conflicts('grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3')).toHaveLength(0)
  })

  it('no className literal in the new area pairs them', () => {
    const offenders = files(SRC)
      .filter((f) => inNewArea(path.relative(SRC, f).split(path.sep).join('/')))
      .flatMap((file) =>
        classLiterals(readFileSync(file, 'utf8')).flatMap((l) => conflicts(l).map((c) => `${path.relative(SRC, file)}: ${c}`))
      )
    expect(offenders).toEqual([])
  })
})
