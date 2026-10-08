import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Text } from '../../atoms/Text'
import type { DialogProps } from './Dialog.types'

// Built on the native <dialog>: showModal() gives the focus trap, Esc
// handling and top-layer rendering for free.
export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      try {
        dialog.showModal()
      } catch {
        dialog.setAttribute('open', '')
      }
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === ref.current) onClose()
  }

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={onBackdropClick}
      className="m-auto w-full max-w-md rounded-lg border border-surface-border p-0 text-neutral-100 shadow-lg backdrop:bg-black/60"
      style={{ backgroundColor: 'var(--color-surface-overlay)' }}
    >
      <div className="flex flex-col gap-4 p-6">
        <Text variant="h3" color="default">
          {title}
        </Text>
        <div className="flex flex-col gap-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 pt-2">{footer}</div>}
      </div>
    </dialog>
  )
}
