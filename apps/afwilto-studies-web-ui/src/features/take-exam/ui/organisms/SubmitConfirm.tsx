import { ConfirmDialog } from '@/shared/ui/organisms/ConfirmDialog'

interface Props {
  unanswered: number
  onConfirm: () => Promise<void>
  onClose: () => void
}

/** "You have 5 unanswered. Submit?" — submitting is final. */
export function SubmitConfirm({ unanswered, onConfirm, onClose }: Props) {
  const title = unanswered > 0 ? `You have ${unanswered} unanswered. Submit?` : 'Submit the practice exam?'
  return (
    <ConfirmDialog title={title} confirmLabel="Yes, submit" onConfirm={onConfirm} onClose={onClose}>
      <p className="text-sm text-neutral-300">After you submit you cannot change your answers.</p>
    </ConfirmDialog>
  )
}
