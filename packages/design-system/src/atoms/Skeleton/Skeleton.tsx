import clsx from 'clsx'
import type { SkeletonProps } from './Skeleton.types'

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      data-testid="skeleton"
      className={clsx('animate-pulse rounded-md bg-brand-700/50', className)}
      {...props}
    />
  )
}
