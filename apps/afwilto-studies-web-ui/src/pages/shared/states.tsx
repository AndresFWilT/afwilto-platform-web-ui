import { Alert, Skeleton } from '@afwilto/design-system'

export function LoadingRows() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

export function LoadError({ error }: { error: Error }) {
  return (
    <Alert variant="error" title="Could not load studies">
      {error.message}
    </Alert>
  )
}
