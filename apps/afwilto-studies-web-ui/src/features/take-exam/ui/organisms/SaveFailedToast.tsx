import { Button } from '@afwilto/design-system'

interface Props {
  /** 1-based question number. */
  question: number
  onRetry: () => void
  onDismiss: () => void
}

/** A failed save keeps the local choice; this offers to send it again. */
export function SaveFailedToast({ question, onRetry, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-md border border-error-500 px-4 py-3 text-sm text-error-300 shadow-lg"
      style={{ backgroundColor: 'var(--color-surface-overlay)' }}
    >
      <span>{`No se pudo guardar la pregunta ${question}`}</span>
      <Button size="sm" variant="secondary" onClick={onRetry}>Reintentar</Button>
      <Button size="sm" variant="ghost" onClick={onDismiss}>Cerrar</Button>
    </div>
  )
}
