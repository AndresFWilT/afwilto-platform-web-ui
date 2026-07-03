import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button } from '@afwilto/design-system'

export function NotFoundPage() {
  return (
    <BaseLayout>
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <Text variant="h1" color="primary">404</Text>
        <Text variant="h3" color="default">Page not found</Text>
        <Text variant="body" color="muted" className="max-w-md">
          The page you are looking for does not exist or has been moved.
        </Text>
        <Link to="/">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    </BaseLayout>
  )
}
