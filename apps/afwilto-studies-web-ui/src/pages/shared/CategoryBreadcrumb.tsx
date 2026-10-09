import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { Category } from '@/application/ports'

/** Root-first ancestry of a category from the flat list (empty if unknown). */
export function ancestryOf(categories: Category[], id: string): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const chain: Category[] = []
  let current = byId.get(id)
  while (current && chain.length <= categories.length) {
    chain.unshift(current)
    current = current.parentId === null ? undefined : byId.get(current.parentId)
  }
  return chain
}

/**
 * `Studies / TI / Cloud`: every level is a link to its category view. With
 * `currentIsPage`, the last level is the page itself (plain text, aria-current).
 */
export function CategoryBreadcrumb({
  categories,
  categoryId,
  currentIsPage = false,
  fallbackPath,
}: {
  categories: Category[]
  categoryId: string
  currentIsPage?: boolean
  /** Shown as plain text when the category is not in `categories` (stale list). */
  fallbackPath?: string
}) {
  const chain = ancestryOf(categories, categoryId)
  const linkClass = 'text-neutral-400 hover:text-primary-300'
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        <li>
          <Link to="/studies" className={linkClass}>
            Studies
          </Link>
        </li>
        {chain.length === 0 && fallbackPath && (
          <>
            <li aria-hidden className="text-neutral-600">/</li>
            <li className="text-neutral-400">{fallbackPath}</li>
          </>
        )}
        {chain.map((c, i) => {
          const last = i === chain.length - 1
          return (
            <Fragment key={c.id}>
              <li aria-hidden className="text-neutral-600">/</li>
              <li>
                {last && currentIsPage ? (
                  <span aria-current="page" className="text-neutral-200">
                    {c.name}
                  </span>
                ) : (
                  <Link to={`/studies/categories/${c.id}`} className={linkClass}>
                    {c.name}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
