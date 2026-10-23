import { Children, isValidElement, memo, useMemo, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeSanitize from 'rehype-sanitize'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { studiesSchema } from './sanitizeSchema'
import { remarkLoneDisplayMath } from './remarkLoneDisplayMath'
import { CodeBlock } from './CodeBlock'
import { MermaidBlock } from './MermaidBlock'
import { MarkdownImage, MarkdownLink } from './links'

// Parent §9.3, in this order: sanitize first, then KaTeX on the sanitized tree.
const KATEX_OPTIONS = { throwOnError: false, trust: false, strict: 'ignore', errorColor: '#F87171' } as const

/** react-markdown drops unknown schemes after sanitizing; `media:` image sources are kept for `MarkdownImage` to resolve. */
function urlTransform(url: string, key: string): string {
  return key === 'src' && url.startsWith('media:') ? url : defaultUrlTransform(url)
}

/** Pulls the fence language and raw text out of `<pre><code class="language-x">`. */
function fence(children: ReactNode): { lang?: string; text: string } {
  const code = Children.toArray(children).find(isValidElement) as
    | ReactElement<{ className?: string; children?: ReactNode }>
    | undefined
  const lang = code?.props.className?.match(/language-(\S+)/)?.[1]
  // An empty fence has a <code> with no children: that is empty text, not the element.
  const text = Children.toArray(code ? (code.props.children ?? '') : children).map(String).join('')
  return { lang, text: text.replace(/\n$/, '') }
}

const components: Components = {
  pre: ({ children }) => {
    const { lang, text } = fence(children)
    return lang?.toLowerCase() === 'mermaid' ? <MermaidBlock source={text} /> : <CodeBlock code={text} lang={lang} />
  },
  code: ({ children }) => (
    <code className="rounded bg-surface-overlay px-1.5 py-0.5 font-mono text-[0.9em] text-primary-200">{children}</code>
  ),
  // Footnotes need ids and aria/data attributes to survive (GFM, F7).
  a: ({ node: _node, ...props }) => <MarkdownLink {...props} />,
  img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} />,
  h1: ({ children, id }) => <h2 id={id} className="mt-8 mb-3 text-2xl font-semibold text-neutral-100">{children}</h2>,
  h2: ({ children, id }) => <h3 id={id} className="mt-7 mb-3 text-xl font-semibold text-neutral-100">{children}</h3>,
  h3: ({ children, id }) => <h4 id={id} className="mt-6 mb-2 text-lg font-semibold text-neutral-100">{children}</h4>,
  h4: ({ children, id }) => <h5 id={id} className="mt-5 mb-2 font-semibold text-neutral-100">{children}</h5>,
  h5: ({ children, id }) => <h6 id={id} className="mt-4 mb-2 text-sm font-semibold text-neutral-200">{children}</h6>,
  h6: ({ children, id }) => <h6 id={id} className="mt-4 mb-2 text-sm font-semibold text-neutral-300">{children}</h6>,
  p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
  ul: ({ children, className }) => <ul className={className ?? 'my-3 list-disc pl-6'}>{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal pl-6">{children}</ol>,
  li: ({ children, className, id }) => (
    <li id={id} className={className === 'task-list-item' ? 'my-1 list-none' : 'my-1'}>
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-primary-500/50 pl-4 text-neutral-400 italic">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-surface-border bg-surface-raised px-3 py-2 text-left">{children}</th>,
  td: ({ children }) => <td className="border border-surface-border px-3 py-2">{children}</td>,
  hr: () => <hr className="my-6 border-surface-border" />,
}

/**
 * Renders a note's Markdown (FR-4); reused by the Slice 09b editor preview.
 * Memoized: the editor re-renders on every keystroke, but the pipeline
 * (parse → sanitize → KaTeX) only runs again when the content changes.
 */
export const MarkdownView = memo(function MarkdownView({
  content,
  resolveMediaUrl,
}: {
  content: string
  /** Resolves `media:<sha256>` images (exams); notes pass nothing and such images render their alt. */
  resolveMediaUrl?: (sha256: string) => string | null
}) {
  // The image component is the one place that resolves `media:`; without a resolver the shared map is used as is.
  const mapped = useMemo<Components>(
    () => (resolveMediaUrl ? { ...components, img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} resolveMediaUrl={resolveMediaUrl} /> } : components),
    [resolveMediaUrl]
  )
  return (
    <div className="text-neutral-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkLoneDisplayMath]}
        rehypePlugins={[
          [rehypeSanitize, studiesSchema],
          [rehypeKatex, KATEX_OPTIONS],
        ]}
        components={mapped}
        urlTransform={urlTransform}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
