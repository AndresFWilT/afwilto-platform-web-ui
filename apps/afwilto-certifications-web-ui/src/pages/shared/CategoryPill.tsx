import { Tag } from '@afwilto/design-system'

interface CategoryPillProps {
  path: string
  onDismiss?: () => void
}

export function CategoryPill({ path, onDismiss }: CategoryPillProps) {
  return <Tag onDismiss={onDismiss}>{path}</Tag>
}
