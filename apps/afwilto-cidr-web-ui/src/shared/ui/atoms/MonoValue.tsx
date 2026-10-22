import type { ReactNode } from 'react'

/** An address, mask or number exactly as the API returned it. */
export function MonoValue({ children }: { children: ReactNode }) {
  return <span className="font-mono text-sm text-neutral-100 break-all">{children}</span>
}
