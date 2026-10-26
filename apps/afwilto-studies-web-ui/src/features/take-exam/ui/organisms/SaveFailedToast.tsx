import { Button } from '@afwilto/design-system'

interface Props {
  /** 1-based question numbers whose save failed, ascending. */
  questions: number[]
  onRetry: () => void
  onDismiss: () => void
}

/** Failed saves keep the local choice; this lists them and offers to send them again. */
export function SaveFailedToast({ questions, onRetry, onDismiss }: Props) {
  const message =
    questions.length === 1 ? `Could not save question ${questions[0]}` : `Could not save questions ${questions.join(', ')}`
  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-md border border-error-500 px-4 py-3 text-sm text-error-300 shadow-lg"
      style={{ backgroundColor: 'var(--color-surface-overlay)' }}
    >
      <span>{message}</span>
      <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>
      <Button size="sm" variant="ghost" onClick={onDismiss}>Close</Button>
    </div>
  )
}
