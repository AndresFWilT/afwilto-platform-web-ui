import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Text } from '@afwilto/design-system'

interface Props {
  back: { to: string; label: string }
  title: string
  children: ReactNode
}

/** Layout of the session form: a readable column with the exam link and the title on top. */
export function SessionSetupTemplate({ back, title, children }: Props) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link to={back.to} className="text-sm text-neutral-400 hover:text-neutral-100">{back.label}</Link>
        <Text variant="h1" color="default">{title}</Text>
      </header>
      {children}
    </div>
  )
}
