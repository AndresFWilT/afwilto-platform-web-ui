import { Text } from '../../atoms/Text'
import type { EmptyStateProps } from './EmptyState.types'

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      {icon && (
        <span aria-hidden className="text-4xl">
          {icon}
        </span>
      )}
      <Text variant="h4" color="default">
        {title}
      </Text>
      {description && (
        <Text variant="body" color="muted" className="max-w-md">
          {description}
        </Text>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
