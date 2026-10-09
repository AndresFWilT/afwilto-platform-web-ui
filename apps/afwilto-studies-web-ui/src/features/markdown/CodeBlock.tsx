import { useEffect, useRef, useState } from 'react'
import { highlight, resolveLanguage } from './highlighter'

type CopyState = 'idle' | 'copied' | 'failed'

const COPY_LABEL: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', failed: 'Copy failed' }

/**
 * A fenced code block (FR-4): plain monospace first, Shiki-highlighted once the
 * lazy highlighter resolves; unknown languages never load it. Always copyable.
 */
export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const shikiLang = resolveLanguage(lang)
  const [html, setHtml] = useState<string | null>(null)
  const [copy, setCopy] = useState<CopyState>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setHtml(null)
    if (!shikiLang) return
    let current = true
    highlight(code, shikiLang).then(
      (out) => current && setHtml(out),
      (e: unknown) => console.warn('[studies] highlighting failed; showing plain code', e)
    )
    return () => {
      current = false
    }
  }, [code, shikiLang])

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  async function copyCode() {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(code)
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopy('idle'), 2000)
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-surface-border bg-[#24292e]">
      <div className="flex items-center justify-between border-b border-surface-border px-3 py-1 text-xs text-neutral-400">
        <span>{lang ?? 'text'}</span>
        <button
          type="button"
          aria-label="Copy code"
          onClick={copyCode}
          className="rounded px-2 py-0.5 hover:bg-surface-overlay hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-400"
        >
          <span aria-live="polite">{COPY_LABEL[copy]}</span>
        </button>
      </div>
      {html !== null ? (
        // Shiki output from text-only input: one of the two §9.3 exceptions.
        <div className="overflow-x-auto p-4 text-sm [&_pre]:!bg-transparent" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="overflow-x-auto p-4 text-sm text-neutral-200">
          <code className="font-mono">{code}</code>
        </pre>
      )}
    </div>
  )
}
