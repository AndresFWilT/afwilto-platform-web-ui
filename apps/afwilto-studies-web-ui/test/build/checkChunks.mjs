// S08-12 (AC-F14): Shiki and Mermaid code must live only in chunks reached
// through dynamic imports — never in the static import closure of the remote
// entry, the app entry, or the library, subject and tag pages. Chunks are
// classified by the modules they contain (vite.config.ts chunkModuleReport),
// so library code inlined into an app or shared chunk is caught too.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const chunks = JSON.parse(readFileSync(path.join(root, 'node_modules/.cache/studies-chunk-report.json'), 'utf8'))
const byFile = new Map(chunks.map((c) => [c.fileName, c]))

const LIBS = {
  shiki: /[\\/]node_modules[\\/].*[\\/](shiki|@shikijs[\\/][^\\/]+)[\\/]/,
  mermaid: /[\\/]node_modules[\\/].*[\\/]mermaid[\\/]/,
  codemirror: /[\\/]node_modules[\\/].*[\\/]@codemirror[\\/][^\\/]+[\\/]/, // Slice 09b §2.7
}
const holds = (chunk, lib) => chunk.moduleIds.some((id) => LIBS[lib].test(id))
const heavy = (chunk) => Object.keys(LIBS).some((lib) => holds(chunk, lib))

const failures = []
for (const lib of Object.keys(LIBS)) {
  const holders = chunks.filter((c) => holds(c, lib))
  if (holders.length === 0) failures.push(`no chunk holds ${lib}: the check would be vacuous`)
  else if (!holders.some((c) => chunks.some((o) => o.dynamicImports.includes(c.fileName)))) {
    failures.push(`no ${lib} chunk is reached by a dynamic import`)
  }
}

const ROOTS = {
  'remoteEntry.js': (c) => c.fileName === 'remoteEntry.js',
  'app entry': (c) => Boolean(c.facadeModuleId?.endsWith('/src/App.tsx')),
  LibraryPage: (c) => Boolean(c.facadeModuleId?.endsWith('/src/pages/Library/LibraryPage.tsx')),
  SubjectPage: (c) => Boolean(c.facadeModuleId?.endsWith('/src/pages/Subject/SubjectPage.tsx')),
  TagPage: (c) => Boolean(c.facadeModuleId?.endsWith('/src/pages/Tag/TagPage.tsx')),
  CategoryPage: (c) => Boolean(c.facadeModuleId?.endsWith('/src/pages/Category/CategoryPage.tsx')),
  NotePage: (c) => Boolean(c.facadeModuleId?.endsWith('/src/pages/Note/NotePage.tsx')),
}

function staticClosure(fileName, seen = new Set()) {
  const chunk = byFile.get(fileName)
  if (!chunk || seen.has(fileName)) return seen
  seen.add(fileName)
  for (const dep of chunk.imports) staticClosure(dep, seen)
  return seen
}

for (const [label, match] of Object.entries(ROOTS)) {
  const rootChunk = chunks.find(match)
  if (!rootChunk) {
    failures.push(`root not found in the build: ${label}`)
    continue
  }
  const leaked = [...staticClosure(rootChunk.fileName)].filter((f) => heavy(byFile.get(f)))
  if (leaked.length) failures.push(`${label} statically reaches shiki/mermaid/codemirror code in ${leaked.join(', ')}`)
}

if (failures.length) {
  console.error('checkChunks FAILED:\n- ' + failures.join('\n- '))
  process.exit(1)
}
const heavyCount = chunks.filter(heavy).length
console.log(`checkChunks OK: ${heavyCount} of ${chunks.length} chunks hold shiki/mermaid/codemirror; none in the static closure of ${Object.keys(ROOTS).length} roots`)
