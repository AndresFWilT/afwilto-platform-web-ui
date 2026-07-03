import { Text } from '../../atoms/Text'
import { Card } from '../../molecules/Card'
import type { AuthLayoutProps } from './AuthLayout.types'

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md">
        {(title || subtitle) && (
          <div className="mb-8 text-center">
            {title && <Text variant="h2" color="default">{title}</Text>}
            {subtitle && <Text variant="small" color="muted" className="mt-2">{subtitle}</Text>}
          </div>
        )}
        <Card padding="lg" shadow border>
          {children}
        </Card>
      </div>
    </div>
  )
}
