import type { ReactNode } from 'react'

interface Props {
  header: ReactNode
  /** A failure banner under the header (submit errors). */
  notice?: ReactNode
  question: ReactNode
  navigator: ReactNode
  footer: ReactNode
  /** Toasts and dialogs; they position themselves. */
  overlays?: ReactNode
}

/** Layout of the runner: header, the question beside the navigator (they wrap on narrow screens), footer. */
export function RunnerTemplate({ header, notice, question, navigator, footer, overlays }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {header}
      {notice}
      <div className="flex flex-wrap items-start gap-6">
        <main className="flex basis-[36rem] grow flex-col gap-4">{question}</main>
        <aside className="flex basis-[16rem] grow flex-col gap-2">{navigator}</aside>
      </div>
      {footer}
      {overlays}
    </div>
  )
}
