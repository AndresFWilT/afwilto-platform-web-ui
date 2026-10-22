import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// Spec 17 AC-F12 / frontend/CLAUDE.md — the MFE standard, enforced on every
// import under src/. Copy this file into every new MFE; adjust CONTEXTS only.
const SRC = path.resolve(__dirname, '../src')
const CONTEXTS = ['cidr']
const TOP_LEVEL_DIRS = ['app', 'features', 'shared', ...CONTEXTS]
const TOP_LEVEL_FILES = ['main.tsx', 'vite-env.d.ts']
const LEVELS = ['atoms', 'molecules', 'organisms', 'templates', 'pages']

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full) : /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g

/** Imported specifiers resolved to src-relative paths; packages are skipped. */
function localImports(fromRel: string, source: string): string[] {
  return [...source.matchAll(IMPORT)]
    .map((m) => m[1] ?? m[2] ?? m[3])
    .flatMap((spec) => {
      if (spec.startsWith('@/')) return [spec.slice(2)]
      if (spec.startsWith('.')) return [path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec))]
      return []
    })
}

interface Zone {
  top: string
  feature?: string
  level?: number
  infrastructure: boolean
}

function zoneOf(rel: string): Zone {
  const parts = rel.split('/')
  const uiIndex = parts.indexOf('ui')
  const level = uiIndex >= 0 ? LEVELS.indexOf(parts[uiIndex + 1] ?? '') : -1
  return {
    top: parts[0],
    feature: parts[0] === 'features' ? parts[1] : undefined,
    level: level >= 0 ? level : undefined,
    infrastructure: CONTEXTS.includes(parts[0]) && parts[1] === 'infrastructure',
  }
}

/** Rule 2 + 3 of the standard for one import edge (paths relative to src/). */
export function edgeViolations(fromRel: string, toRel: string): string[] {
  const from = zoneOf(fromRel)
  const to = zoneOf(toRel)
  const found: string[] = []
  if (from.top === 'features' && to.top === 'features' && from.feature !== to.feature) found.push('feature imports another feature')
  if (from.top !== 'app' && to.top === 'app') found.push('imports app/ (wiring is imported by nothing)')
  if ((from.top === 'shared' || CONTEXTS.includes(from.top)) && to.top === 'features') found.push('shared/context imports a feature')
  if (to.infrastructure && from.top !== 'app' && !from.infrastructure) found.push('infrastructure imported outside app/')
  if (from.level !== undefined && to.level !== undefined && to.level > from.level) {
    found.push(`${LEVELS[from.level]} imports ${LEVELS[to.level]}`)
  }
  return found
}

/** Content rules: no fetch outside infrastructure; the port hook only in pages. */
export function contentViolations(rel: string, source: string): string[] {
  const zone = zoneOf(rel)
  const found: string[] = []
  if (/\bfetch\(/.test(source) && !zone.infrastructure) found.push('fetch( outside infrastructure')
  const callsHook = /\buseServices\(\)/.test(source) && !/export function useServices/.test(source)
  if (callsHook && zone.level !== LEVELS.indexOf('pages')) found.push('useServices() outside a page')
  return found
}

describe('architecture checker (self-test)', () => {
  it('flags every forbidden edge', () => {
    expect(edgeViolations('features/a/ui/pages/P.tsx', 'features/b/ui/organisms/O.tsx')).not.toEqual([])
    expect(edgeViolations('features/a/ui/atoms/A.tsx', 'features/a/ui/organisms/O.tsx')).not.toEqual([])
    expect(edgeViolations('features/a/ui/organisms/O.tsx', 'shared/ui/templates/T.tsx')).not.toEqual([])
    expect(edgeViolations('shared/ui/organisms/O.tsx', 'features/a/ui/atoms/A.tsx')).not.toEqual([])
    expect(edgeViolations('features/a/ui/pages/P.tsx', 'cidr/infrastructure/http/X.ts')).not.toEqual([])
    expect(edgeViolations('features/a/ui/pages/P.tsx', 'app/di/container.ts')).not.toEqual([])
  })

  it('allows the permitted edges', () => {
    expect(edgeViolations('features/a/ui/pages/P.tsx', 'shared/ui/templates/T.tsx')).toEqual([])
    expect(edgeViolations('features/a/ui/organisms/O.tsx', 'shared/ui/organisms/R.tsx')).toEqual([])
    expect(edgeViolations('features/a/ui/organisms/O.tsx', 'cidr/domain/types.ts')).toEqual([])
    expect(edgeViolations('app/di/container.ts', 'cidr/infrastructure/http/X.ts')).toEqual([])
    expect(edgeViolations('app/routes.tsx', 'features/a/ui/pages/P.tsx')).toEqual([])
  })

  it('flags fetch and misplaced hook calls', () => {
    expect(contentViolations('shared/lib/x.ts', 'await fetch(url)')).not.toEqual([])
    expect(contentViolations('features/a/ui/organisms/O.tsx', 'const s = useServices()')).not.toEqual([])
    expect(contentViolations('features/a/ui/pages/P.tsx', 'const s = useServices()')).toEqual([])
  })
})

describe('src/ follows the MFE standard', () => {
  it('has only the screaming top-level folders and entry files', () => {
    const entries = readdirSync(SRC)
    const dirs = entries.filter((e) => statSync(path.join(SRC, e)).isDirectory())
    const plain = entries.filter((e) => !dirs.includes(e))
    expect(dirs.filter((d) => !TOP_LEVEL_DIRS.includes(d))).toEqual([])
    expect(plain.filter((f) => !TOP_LEVEL_FILES.includes(f))).toEqual([])
    expect(dirs).toEqual(expect.arrayContaining(TOP_LEVEL_DIRS))
  })

  it('every feature lives under features/<use-case>/ui/<atomic level>/', () => {
    const misplaced = files(path.join(SRC, 'features'))
      .map((f) => path.relative(SRC, f).split(path.sep).join('/'))
      .filter((rel) => !new RegExp(`^features/[a-z0-9-]+/ui/(${LEVELS.join('|')})/`).test(rel))
    expect(misplaced).toEqual([])
  })

  it('no import edge or source breaks rules 2-3', () => {
    const offenders = files(SRC).flatMap((file) => {
      const rel = path.relative(SRC, file).split(path.sep).join('/')
      const source = readFileSync(file, 'utf8')
      return [
        ...localImports(rel, source).flatMap((to) => edgeViolations(rel, to).map((v) => `${rel} → ${to}: ${v}`)),
        ...contentViolations(rel, source).map((v) => `${rel}: ${v}`),
      ]
    })
    expect(offenders).toEqual([])
  })
})
