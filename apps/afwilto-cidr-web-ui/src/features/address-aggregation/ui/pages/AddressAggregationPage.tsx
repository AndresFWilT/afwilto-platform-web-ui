import { Alert, Text } from '@afwilto/design-system'
import { useServices } from '@/shared/di'
import { useCalculation } from '@/shared/lib/useCalculation'
import { CalculatorTemplate } from '@/shared/ui/templates/CalculatorTemplate'
import { AggregateForm } from '../organisms/AggregateForm'
import { AggregationResult } from '../organisms/AggregationResult'

/** Spec 17 FR-4 / FR-7: many IPv4 addresses in, the fewest CIDR blocks out. */
export function AddressAggregationPage() {
  const { calculator } = useServices()
  const { state, run } = useCalculation((addresses: string[]) => calculator.aggregate(addresses))

  return (
    <CalculatorTemplate>
      <Text variant="body" color="muted">
        Paste IPv4 addresses; duplicates are ignored and neighbours are merged into the fewest CIDR blocks.
      </Text>
      <AggregateForm
        pending={state.status === 'pending'}
        serverViolations={state.status === 'invalid' ? state.error.violations : []}
        onSubmit={run}
      />
      {state.status === 'failed' && (
        <Alert variant="error" title="Aggregation failed">
          {state.message}
        </Alert>
      )}
      {state.status === 'done' && <AggregationResult aggregation={state.result} />}
    </CalculatorTemplate>
  )
}
