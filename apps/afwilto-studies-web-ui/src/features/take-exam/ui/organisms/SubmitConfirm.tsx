import { ConfirmDialog } from '@/shared/ui/organisms/ConfirmDialog'

interface Props {
  unanswered: number
  onConfirm: () => Promise<void>
  onClose: () => void
}

/** "Te quedan 5 sin responder. ¿Entregar?" — submitting is final. */
export function SubmitConfirm({ unanswered, onConfirm, onClose }: Props) {
  const title = unanswered > 0 ? `Te quedan ${unanswered} sin responder. ¿Entregar?` : '¿Entregar el simulacro?'
  return (
    <ConfirmDialog title={title} confirmLabel="Sí, entregar" onConfirm={onConfirm} onClose={onClose}>
      <p className="text-sm text-neutral-300">Después de entregar no podrás cambiar tus respuestas.</p>
    </ConfirmDialog>
  )
}
