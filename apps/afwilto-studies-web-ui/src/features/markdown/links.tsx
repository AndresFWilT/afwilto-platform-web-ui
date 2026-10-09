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

/** Images: https only; anything else renders its alt text and is never requested. */
export function MarkdownImage({ src, alt }: ComponentPropsWithoutRef<'img'>) {
  if (typeof src !== 'string' || !src.startsWith('https://')) return <>{alt ?? ''}</>
  return <img src={src} alt={alt ?? ''} loading="lazy" referrerPolicy="no-referrer" className="my-4 max-w-full rounded-lg" />
}
