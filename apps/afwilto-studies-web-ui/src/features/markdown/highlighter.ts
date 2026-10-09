// The only module that loads Shiki, and only through import() (AC-F14).
// Core + JavaScript regex engine (no WASM to fetch across the federation
// origin), one theme, and the parent FR-4 languages, each its own lazy chunk.

type ShikiLanguageModule = Promise<{ default: unknown }>

const LANGUAGE_LOADERS: Record<string, () => ShikiLanguageModule> = {
  go: () => import('shiki/langs/go.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  csharp: () => import('shiki/langs/csharp.mjs'),
  c: () => import('shiki/langs/c.mjs'),
  cpp: () => import('shiki/langs/cpp.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  php: () => import('shiki/langs/php.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  shellscript: () => import('shiki/langs/shellscript.mjs'),
  powershell: () => import('shiki/langs/powershell.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  dockerfile: () => import('shiki/langs/dockerfile.mjs'),
  hcl: () => import('shiki/langs/hcl.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
}

/** Fence names accepted by the editor (parent FR-4) → Shiki language ids. */
const FENCE_TO_SHIKI: Record<string, string> = {
  ...Object.fromEntries(Object.keys(LANGUAGE_LOADERS).filter((l) => l !== 'shellscript').map((l) => [l, l])),
  bash: 'shellscript',
  shell: 'shellscript',
  plaintext: 'text', // Shiki's built-in plain language: nothing to load
}

export const SUPPORTED_LANGUAGES: readonly string[] = Object.keys(FENCE_TO_SHIKI)

const THEME = 'github-dark'

/** The Shiki language for a fence, or null when it must render as plain text. */
export function resolveLanguage(lang: string | undefined): string | null {
  if (!lang) return null
  return FENCE_TO_SHIKI[lang.toLowerCase()] ?? null
}

type Highlighter = Awaited<ReturnType<(typeof import('shiki/core'))['createHighlighterCore']>>

let highlighter: Promise<Highlighter> | null = null

function loadHighlighter(): Promise<Highlighter> {
  highlighter ??= Promise.all([import('shiki/core'), import('shiki/engine/javascript')]).then(
    ([core, engine]) =>
      core.createHighlighterCore({
        themes: [import('shiki/themes/github-dark.mjs')],
        langs: [],
        engine: engine.createJavaScriptRegexEngine({ forgiving: true }),
      })
  )
  highlighter.catch(() => {
    highlighter = null // a failed load may be retried by the next block
  })
  return highlighter
}

/** HTML for `code` in a resolved Shiki language (see resolveLanguage). */
export async function highlight(code: string, lang: string): Promise<string> {
  const hl = await loadHighlighter()
  const loader = LANGUAGE_LOADERS[lang]
  if (loader && !hl.getLoadedLanguages().includes(lang)) {
    await hl.loadLanguage((await loader()).default as Parameters<Highlighter['loadLanguage']>[0])
  }
  return hl.codeToHtml(code, { lang, theme: THEME })
}
