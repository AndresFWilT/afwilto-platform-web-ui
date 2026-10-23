import type { ComponentPropsWithoutRef } from 'react'
import { Link } from 'react-router-dom'

const EXTERNAL = /^(https?:|mailto:|\/\/)/i

/** FR-6: single-slash paths navigate client-side; anything leaving the origin opens a new tab. */
export function MarkdownLink({ href, children, className: _ignored, target: _target, rel: _rel, ...rest }: ComponentPropsWithoutRef<'a'>) {
  // `rest` carries what the sanitizer let through (id, aria-*, data-*), e.g. footnote wiring.
  const className = 'text-primary-300 underline decoration-primary-300/40 underline-offset-2 hover:decoration-primary-300'
  if (!href) return <>{children}</>
  // Footnote references would point at a definitions section that is not
  // rendered (react-markdown 10 + remark-gfm 4), so they stay plain text.
  if ('data-footnote-ref' in rest || 'data-footnote-backref' in rest) return <>{children}</>
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link {...rest} to={href} className={className}>
        {children}
      </Link>
    )
  }
  if (EXTERNAL.test(href)) {
    return (
      <a {...rest} href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <a {...rest} href={href} className={className}>
      {children}
    </a>
  )
}

const MEDIA_SRC = /^media:([0-9a-f]{64})$/i

/**
 * Images: https always; `media:<sha256>` only through `resolveMediaUrl`. Anything
 * else, or a resolver that returns null, renders its alt text and is never requested.
 */
export function MarkdownImage({
  src,
  alt,
  resolveMediaUrl,
}: ComponentPropsWithoutRef<'img'> & { resolveMediaUrl?: (sha256: string) => string | null }) {
  if (typeof src !== 'string') return <>{alt ?? ''}</>
  let url: string | null = src
  const media = MEDIA_SRC.exec(src)
  if (src.startsWith('media:')) url = media && resolveMediaUrl ? resolveMediaUrl(media[1]) : null
  else if (!src.startsWith('https://')) url = null
  if (!url) return <>{alt ?? ''}</>
  return <img src={url} alt={alt ?? ''} loading="lazy" referrerPolicy="no-referrer" className="my-4 max-w-full rounded-lg" />
}
