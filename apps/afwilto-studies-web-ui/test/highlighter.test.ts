import { describe, it, expect } from 'vitest'
import { SUPPORTED_LANGUAGES, resolveLanguage } from '../src/features/markdown/highlighter'

const PARENT_FR4 = [
  'go', 'typescript', 'tsx', 'javascript', 'jsx', 'python', 'java', 'csharp', 'c', 'cpp', 'rust', 'php', 'sql',
  'bash', 'shell', 'powershell', 'yaml', 'json', 'toml', 'dockerfile', 'hcl', 'html', 'css', 'markdown', 'diff',
  'plaintext',
]

describe('resolveLanguage (FR-4, S08-3)', () => {
  it('supports exactly the 26 languages of parent FR-4', () => {
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual([...PARENT_FR4].sort())
  })

  it.each(PARENT_FR4.filter((l) => !['bash', 'shell', 'plaintext'].includes(l)))('%s maps to itself', (lang) => {
    expect(resolveLanguage(lang)).toBe(lang)
  })

  it.each([
    ['bash', 'shellscript'],
    ['shell', 'shellscript'],
    ['Shell', 'shellscript'],
    ['plaintext', 'text'],
    ['GO', 'go'],
  ])('%s maps to %s', (lang, shiki) => {
    expect(resolveLanguage(lang)).toBe(shiki)
  })

  it.each([undefined, '', 'cobol', 'ts', 'mermaid', 'math'])('%s is unsupported (plain monospace)', (lang) => {
    expect(resolveLanguage(lang)).toBeNull()
  })
})
