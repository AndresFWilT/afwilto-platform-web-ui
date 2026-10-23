import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Text } from '@afwilto/design-system'

interface Props {
  /** The link above the title (a parent page); omitted on the pages with nothing above them. */
  back?: { to: string; label: string }
  title: string
  /** Facts under the title (parameters, counts) and the page actions; both optional slots. */
  meta?: ReactNode
  actions?: ReactNode
  /** `form` pages (edit) keep a readable line length, `narrow` ones (new) a shorter one; `full` uses the whole content width. */
  width?: 'full' | 'form' | 'narrow'
  children: ReactNode
}

const WIDTH = { full: '', form: 'max-w-3xl', narrow: 'max-w-xl' } as const

/** Layout of the exam management pages: back link, title, optional meta and actions, then the sections. */
export function ManageExamTemplate({ back, title, meta, actions, width = 'full', children }: Props) {
  return (
    <div className={`flex flex-col gap-6 ${WIDTH[width]}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {back && (
            <Link to={back.to} className="text-sm text-neutral-400 hover:text-neutral-100">
              {back.label}
            </Link>
          )}
          <Text variant="h1" color="default">{title}</Text>
          {meta}
        </div>
        {actions}
      </header>
      {children}
    </div>
  )
}
