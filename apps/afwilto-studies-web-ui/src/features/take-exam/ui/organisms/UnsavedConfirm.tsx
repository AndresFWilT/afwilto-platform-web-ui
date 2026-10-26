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
    <ConfirmDialog title="Some answers are not saved. Submit anyway?" confirmLabel="Yes, submit" onConfirm={onConfirm} onClose={onClose}>
      <p className="text-sm text-neutral-300">{`Unsaved questions: ${questions.join(', ')}`}</p>
      <p className="text-sm text-neutral-300">Those answers will count as unanswered.</p>
    </ConfirmDialog>
  )
}
