import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

// The federation plugin's remotes are opaque at runtime, so the registration
// is checked at the source: a remote missing here 404s only in the browser.
describe('studies remote registration (Spec 16 AC-F1, S07-1)', () => {
  it('vite.config.ts registers the studies remote with its env override and :3008 default', () => {
    const config = read('vite.config.ts')
    expect(config).toMatch(/studies:\s*\{\s*type: 'module',\s*name: 'studies',/)
    expect(config).toContain(
      "entry: env.VITE_REMOTE_STUDIES_URL ?? 'http://localhost:3008/remoteEntry.js'"
    )
  })

  it('declares the studies/App module type and exports StudiesApp', () => {
    expect(read('src/remotes/federation.d.ts')).toContain("declare module 'studies/App'")
    expect(read('src/remotes/remotes.ts')).toContain("export const StudiesApp = lazy(() => import('studies/App'))")
  })
})
