import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Text } from '@afwilto/design-system'

interface Props {
  back: { to: string; label: string }
  title: string
  /** The step indicator under the title. */
  steps: ReactNode
  children: ReactNode
}

/** Layout of the import wizard: heading with the steps, then the current step. */
export function ImportWizardTemplate({ back, title, steps, children }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link to={back.to} className="text-sm text-neutral-400 hover:text-neutral-100">{back.label}</Link>
        <Text variant="h1" color="default">{title}</Text>
        {steps}
      </header>
      {children}
    </div>
  )
}
