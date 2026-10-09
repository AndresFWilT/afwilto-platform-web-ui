import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(__dirname, '../src')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full) : /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

const sources = files(SRC).map((f) => ({ rel: path.relative(SRC, f).split(path.sep).join('/'), text: readFileSync(f, 'utf8') }))
const matching = (re: RegExp) => sources.filter((s) => re.test(s.text)).map((s) => s.rel).sort()

describe('lazy boundaries (AC-F14, S08-11)', () => {
  it('never imports shiki or mermaid statically (type-only imports are erased)', () => {
    expect(matching(/^\s*import\s+(?!type\b)[^;]*?from\s+['"](shiki|mermaid|@shikijs)[/'"]/m)).toEqual([])
    expect(matching(/^\s*import\s+['"](shiki|mermaid|@shikijs)[/'"]/m)).toEqual([])
  })

  it('loads shiki only from highlighter.ts and mermaid only from mermaid.ts', () => {
    expect(matching(/import\(\s*['"](shiki|@shikijs)[/'"]/)).toEqual(['features/markdown/highlighter.ts'])
    expect(matching(/import\(\s*['"]mermaid['"]\s*\)/)).toEqual(['features/markdown/mermaid.ts'])
  })

  it('injects HTML only for the Shiki and Mermaid outputs', () => {
    expect(matching(/dangerouslySetInnerHTML|\.innerHTML\s*=/)).toEqual([
      'features/markdown/CodeBlock.tsx',
      'features/markdown/MermaidBlock.tsx',
    ])
  })

  it('library, subject, tag and shared page modules never reach the markdown feature', () => {
    const offenders = sources
      .filter((s) => /^pages\/(Library|Subject|Tag|Category|Categories|Kinds|shared)\//.test(s.rel))
      .filter((s) => /features\/markdown/.test(s.text))
      .map((s) => s.rel)
    expect(offenders).toEqual([])
    expect(matching(/features\/markdown/)).toContain('pages/Note/NotePage.tsx')
  })
})
