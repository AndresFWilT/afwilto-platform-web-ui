import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// Spec 18 slice 07 §1.1 / D-14 — the studies MFE keeps its legacy layout; the NEW area
// (src/exams, src/shared and every src/features/<use-case> except the legacy editor and
// markdown) follows the 2026-10-21 MFE standard (frontend/CLAUDE.md), enforced here on
// every import under src/. Modeled on apps/afwilto-cidr-web-ui/test/architecture.test.ts.
const SRC = path.resolve(__dirname, '../src')
const LEVELS = ['atoms', 'molecules', 'organisms', 'templates', 'pages']

const LEGACY_TOP_DIRS = ['application', 'domain', 'di', 'features', 'hooks', 'infrastructure', 'layouts', 'pages', 'router']
const NEW_TOP_DIRS = ['exams', 'shared']
const LEGACY_FEATURES = ['editor', 'markdown']
const ROOT_FILES = ['App.tsx', 'main.tsx', 'index.css', 'vite-env.d.ts']

/** The only places legacy code may import the new area from. */
const LEGACY_TO_NEW = ['router/routes', 'di/container', 'pages/Subject/SubjectPage']
/** The only legacy modules the new area may import. */
const NEW_TO_LEGACY = ['features/markdown/MarkdownView', 'di', 'hooks/useAsync']

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full) : /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

const IMPORT = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g

/** `a/b.tsx` and `a/b/index.ts` both become the module id `a/b`. */
function moduleId(rel: string): string {
  return rel.replace(/\.(ts|tsx)$/, '').replace(/\/index$/, '')
}

/** Imported specifiers resolved to src-relative module ids; packages are skipped. */
function localImports(fromRel: string, source: string): string[] {
  return [...source.matchAll(IMPORT)]
    .map((m) => m[1] ?? m[2] ?? m[3])
    .flatMap((spec) => {
      if (spec.startsWith('@/')) return [moduleId(spec.slice(2))]
      if (spec.startsWith('.')) return [moduleId(path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec)))]
      return []
    })
}

function isNewArea(rel: string): boolean {
  const [top, second] = rel.split('/')
  return NEW_TOP_DIRS.includes(top) || (top === 'features' && !LEGACY_FEATURES.includes(second))
}

interface Zone {
  feature?: string
  level?: number
  top: string
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
    infrastructure: parts[0] === 'exams' && parts[1] === 'infrastructure',
  }
}

/** The bridge rules plus rules 2 and 3 of the standard for one import edge (module ids relative to src/). */
export function edgeViolations(fromRel: string, toRel: string): string[] {
  const from = moduleId(fromRel)
  const to = moduleId(toRel)
  const fromNew = isNewArea(from)
  const toNew = isNewArea(to)
  if (!fromNew && toNew) {
    return LEGACY_TO_NEW.includes(from) ? [] : ['legacy code imports the new area outside the allowed bridges']
  }
  if (fromNew && !toNew) {
    return NEW_TO_LEGACY.includes(to) ? [] : ['new area imports legacy code outside the allowed bridges']
  }
  if (!fromNew) return []

  const a = zoneOf(from)
  const b = zoneOf(to)
  const found: string[] = []
  if (a.top === 'features' && b.top === 'features' && a.feature !== b.feature) found.push('feature imports another feature')
  if ((a.top === 'shared' || a.top === 'exams') && b.top === 'features') found.push('shared/context imports a feature')
  if (b.infrastructure && !a.infrastructure) found.push('infrastructure imported outside exams/infrastructure')
  if (a.level !== undefined && b.level !== undefined && b.level > a.level) found.push(`${LEVELS[a.level]} imports ${LEVELS[b.level]}`)
  return found
}

/** Content rules for new-area files: no fetch outside infrastructure; the port hook only in pages. */
export function contentViolations(rel: string, source: string): string[] {
  if (!isNewArea(moduleId(rel))) return []
  const zone = zoneOf(rel)
  const found: string[] = []
  if (/\bfetch\(/.test(source) && !zone.infrastructure) found.push('fetch( outside exams/infrastructure')
  const callsHook = /\buseServices\(\)/.test(source)
  if (callsHook && zone.level !== LEVELS.indexOf('pages')) found.push('useServices() outside a page')
  return found
}

describe('exams architecture checker (self-test, S07-6)', () => {
  it('flags the three planted violations', () => {
    expect(edgeViolations('pages/Library/LibraryPage.tsx', 'exams/infrastructure/http/ExamsHttpAdapter')).not.toEqual([])
    expect(contentViolations('shared/ui/organisms/QuestionView.tsx', 'const s = useServices()')).not.toEqual([])
    expect(edgeViolations('features/take-exam/ui/pages/TakeExamPage.tsx', 'features/manage-exams/ui/organisms/ExamForm')).not.toEqual([])
  })

  it('flags the other forbidden edges', () => {
    expect(edgeViolations('pages/Library/LibraryPage.tsx', 'shared/ui/organisms/QuestionView')).not.toEqual([])
    expect(edgeViolations('layouts/StudiesLayout.tsx', 'features/take-exam/ui/pages/TakeExamPage')).not.toEqual([])
    expect(edgeViolations('shared/ui/molecules/OptionRow.tsx', 'pages/shared/states')).not.toEqual([])
    expect(edgeViolations('shared/ui/molecules/OptionRow.tsx', 'application/ports')).not.toEqual([])
    expect(edgeViolations('shared/ui/molecules/OptionRow.tsx', 'features/editor/SourceEditor')).not.toEqual([])
    expect(edgeViolations('features/take-exam/ui/pages/P.tsx', 'exams/infrastructure/http/ExamsHttpAdapter')).not.toEqual([])
    expect(edgeViolations('shared/ui/atoms/A.tsx', 'shared/ui/organisms/O')).not.toEqual([])
    expect(edgeViolations('features/take-exam/ui/organisms/O.tsx', 'shared/ui/templates/T')).not.toEqual([])
    expect(edgeViolations('shared/ui/organisms/O.tsx', 'features/take-exam/ui/atoms/A')).not.toEqual([])
    expect(edgeViolations('exams/domain/types.ts', 'features/take-exam/ui/atoms/A')).not.toEqual([])
    expect(contentViolations('exams/domain/x.ts', 'await fetch(url)')).not.toEqual([])
    expect(contentViolations('features/take-exam/ui/organisms/O.tsx', 'const s = useServices()')).not.toEqual([])
  })

  it('flags data fetching below a page: @/di and useAsync in atoms, molecules and organisms (review fix 13)', () => {
    for (const from of ['features/take-exam/ui/organisms/O', 'features/take-exam/ui/molecules/M', 'shared/ui/atoms/A', 'shared/ui/organisms/O']) {
      expect(edgeViolations(`${from}.tsx`, 'di')).not.toEqual([])
      expect(edgeViolations(`${from}.tsx`, 'di/index')).not.toEqual([])
      expect(edgeViolations(`${from}.tsx`, 'hooks/useAsync')).not.toEqual([])
    }
    expect(contentViolations('features/take-exam/ui/organisms/O.tsx', 'const data = useAsync(() => load(), [])')).not.toEqual([])
    expect(contentViolations('shared/ui/molecules/M.tsx', "import { useAsync } from '@/hooks/useAsync'")).not.toEqual([])
    expect(contentViolations('features/take-exam/ui/pages/P.tsx', 'const data = useAsync(() => load(), [])')).toEqual([])
  })

  it('allows the permitted edges', () => {
    expect(edgeViolations('router/routes.tsx', 'features/manage-exams/ui/pages/ExamsPage')).toEqual([])
    expect(edgeViolations('di/container.ts', 'exams/infrastructure/http/ExamsHttpAdapter')).toEqual([])
    expect(edgeViolations('di/container.ts', 'exams/application/ports')).toEqual([])
    expect(edgeViolations('pages/Subject/SubjectPage.tsx', 'exams/domain')).toEqual([])
    expect(edgeViolations('shared/ui/molecules/OptionRow.tsx', 'features/markdown/MarkdownView')).toEqual([])
    expect(edgeViolations('features/take-exam/ui/pages/P.tsx', 'di')).toEqual([])
    expect(edgeViolations('features/take-exam/ui/pages/P.tsx', 'di/index')).toEqual([])
    expect(edgeViolations('features/take-exam/ui/pages/P.tsx', 'hooks/useAsync')).toEqual([])
    expect(edgeViolations('features/take-exam/ui/pages/P.tsx', 'shared/ui/templates/T')).toEqual([])
    expect(edgeViolations('features/take-exam/ui/organisms/O.tsx', 'shared/ui/organisms/QuestionView')).toEqual([])
    expect(edgeViolations('features/take-exam/ui/organisms/O.tsx', 'exams/domain')).toEqual([])
    expect(edgeViolations('exams/infrastructure/http/ExamsHttpAdapter.ts', 'exams/application/ports')).toEqual([])
    expect(edgeViolations('pages/Library/LibraryPage.tsx', 'application/ports')).toEqual([])
    expect(edgeViolations('features/markdown/MarkdownView.tsx', 'features/markdown/links')).toEqual([])
  })

  it('allows useServices() in pages and fetch( in exams/infrastructure only', () => {
    expect(contentViolations('features/take-exam/ui/pages/P.tsx', 'const s = useServices()')).toEqual([])
    expect(contentViolations('exams/infrastructure/http/X.ts', 'await fetch(url)')).toEqual([])
    expect(contentViolations('pages/Library/LibraryPage.tsx', 'const s = useServices()')).toEqual([])
  })
})

describe('src/ keeps the legacy layout and the new area follows the standard', () => {
  const rel = (file: string) => path.relative(SRC, file).split(path.sep).join('/')
  const underNew = files(SRC).map(rel).filter((r) => isNewArea(r))

  it('has only the legacy folders plus exams/ and shared/, and no loose files beyond the entries', () => {
    const entries = readdirSync(SRC)
    const dirs = entries.filter((e) => statSync(path.join(SRC, e)).isDirectory())
    expect(dirs.filter((d) => ![...LEGACY_TOP_DIRS, ...NEW_TOP_DIRS].includes(d))).toEqual([])
    expect(dirs).toEqual(expect.arrayContaining(NEW_TOP_DIRS))
    expect(entries.filter((e) => !dirs.includes(e) && !ROOT_FILES.includes(e))).toEqual([])
  })

  it('exams/ holds domain, application/ports and infrastructure/{http,memory} only', () => {
    const misplaced = underNew
      .filter((r) => r.startsWith('exams/'))
      .filter((r) => !/^exams\/(domain\/|application\/ports\/|infrastructure\/(http|memory)\/)/.test(r))
    expect(misplaced).toEqual([])
  })

  it('shared/ holds di, lib and ui/<atomic level> only', () => {
    const misplaced = underNew
      .filter((r) => r.startsWith('shared/'))
      .filter((r) => !new RegExp(`^shared/(di/|lib/|ui/(${LEVELS.join('|')})/)`).test(r))
    expect(misplaced).toEqual([])
  })

  it('every new feature lives under features/<use-case>/ui/<atomic level>/', () => {
    const misplaced = underNew
      .filter((r) => r.startsWith('features/'))
      .filter((r) => !new RegExp(`^features/[a-z0-9-]+/ui/(${LEVELS.join('|')})/`).test(r))
    expect(misplaced).toEqual([])
  })

  it('features are named after use cases, never a technical role', () => {
    const features = new Set(underNew.filter((r) => r.startsWith('features/')).map((r) => r.split('/')[1]))
    expect([...features].filter((f) => /^(forms?|tables?|components?|utils?|helpers?|common|core)$/.test(f))).toEqual([])
  })

  it('no import edge or source breaks the bridges or rules 2-3', () => {
    const offenders = files(SRC).flatMap((file) => {
      const r = rel(file)
      const source = readFileSync(file, 'utf8')
      return [
        ...localImports(r, source).flatMap((to) => edgeViolations(r, to).map((v) => `${r} → ${to}: ${v}`)),
        ...contentViolations(r, source).map((v) => `${r}: ${v}`),
      ]
    })
    expect(offenders).toEqual([])
  })
})
