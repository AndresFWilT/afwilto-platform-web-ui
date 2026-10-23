import type { ReactNode } from 'react'
import { Text } from '@afwilto/design-system'

interface Props {
  /** The exam name above the title, when known. */
  examName?: string
  title: string
  /** A notice before the summary (answers that never reached the server). */
  notice?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Layout of the result: heading, then the score, breakdown and review stacked. */
export function ResultTemplate({ examName, title, notice, children, footer }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        {examName && <Text variant="small" color="muted">{examName}</Text>}
        <Text variant="h1" color="default">{title}</Text>
      </header>
      {notice}
      {children}
      {footer && <div>{footer}</div>}
    </div>
  )
}
