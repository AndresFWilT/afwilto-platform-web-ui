import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Text } from '@afwilto/design-system'

interface Props {
  back: { to: string; label: string }
  title: string
  filters?: ReactNode
  list?: ReactNode
  /** The opened question beside the list; absent when none is open. */
  detail?: ReactNode
  /** Dialogs. */
  overlays?: ReactNode
  /** Replaces filters, list and detail (an empty bank). */
  empty?: ReactNode
}

/** Layout of the bank browser: heading, filters, then the list beside the opened question (they wrap). */
export function QuestionBankTemplate({ back, title, filters, list, detail, overlays, empty }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <Link to={back.to} className="text-sm text-neutral-400 hover:text-neutral-100">{back.label}</Link>
        <Text variant="h1" color="default">{title}</Text>
      </header>
      {empty ?? (
        <>
          {filters}
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex basis-[24rem] grow flex-col gap-2">{list}</div>
            {detail && (
              <section aria-label="Selected question" className="flex basis-[28rem] grow flex-col gap-3 rounded-lg border border-surface-border p-4">
                {detail}
              </section>
            )}
          </div>
        </>
      )}
      {overlays}
    </div>
  )
}
