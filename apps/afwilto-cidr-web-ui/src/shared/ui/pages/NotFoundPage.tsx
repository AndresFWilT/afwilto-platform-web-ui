import { EmptyState } from '@afwilto/design-system'
import { CalculatorTemplate } from '@/shared/ui/templates/CalculatorTemplate'

export function NotFoundPage() {
  return (
    <CalculatorTemplate>
      <EmptyState title="Not found" description="This calculator does not exist. Pick one of the tabs above." />
    </CalculatorTemplate>
  )
}
