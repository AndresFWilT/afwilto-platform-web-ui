import type { HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Sizing comes from className (e.g. "h-4 w-32"). */
  className?: string
}
