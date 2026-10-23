import { useState } from 'react'

/** An image that shows its alt text in a bordered placeholder when it cannot be loaded. */
export function SafeImage({
  src,
  alt,
  className = '',
  onBroken,
}: {
  src: string | null
  alt: string
  className?: string
  onBroken?: () => void
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-full min-h-24 w-full items-center justify-center rounded border border-dashed border-surface-border p-3 text-center text-sm text-neutral-400"
      >
        {alt}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        setFailedSrc(src)
        onBroken?.()
      }}
    />
  )
}
