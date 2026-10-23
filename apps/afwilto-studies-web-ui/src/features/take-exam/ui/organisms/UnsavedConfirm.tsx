import { ConfirmDialog } from '@/shared/ui/organisms/ConfirmDialog'

interface Props {
  /** 1-based question numbers whose answer the server does not have. */
  questions: number[]
  onConfirm: () => Promise<void>
  onClose: () => void
}

/** Asked when a manual submit still has answers the server never received. */
export function UnsavedConfirm({ questions, onConfirm, onClose }: Props) {
  return (
    <ConfirmDialog title="Hay respuestas sin guardar. ¿Entregar de todos modos?" confirmLabel="Sí, entregar" onConfirm={onConfirm} onClose={onClose}>
      <p className="text-sm text-neutral-300">{`Preguntas sin guardar: ${questions.join(', ')}`}</p>
      <p className="text-sm text-neutral-300">Esas respuestas contarán como no contestadas.</p>
    </ConfirmDialog>
  )
}
