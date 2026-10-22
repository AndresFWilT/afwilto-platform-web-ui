import { Alert, Text } from '@afwilto/design-system'
import { useServices } from '@/shared/di'
import { useCalculation } from '@/shared/lib/useCalculation'
import { CalculatorTemplate } from '@/shared/ui/templates/CalculatorTemplate'
import { RangeSummaryResult } from '../organisms/RangeSummaryResult'
import { RangeToCidrForm } from '../organisms/RangeToCidrForm'

/** Spec 17 FR-3 / FR-7: an address range in, its minimal CIDR cover out. */
export function RangeToCidrPage() {
  const { calculator } = useServices()
  const { state, run } = useCalculation((first: string, last: string) => calculator.summarizeRange(first, last))
  const invalid = state.status === 'invalid' ? state.error : undefined

  return (
    <CalculatorTemplate>
      <Text variant="body" color="muted">
        Enter the first and last address of an IPv4 or IPv6 range to get the fewest CIDR blocks that cover it exactly.
      </Text>
      <RangeToCidrForm
        pending={state.status === 'pending'}
        serverErrors={{ firstIp: invalid?.messageFor('firstIp'), lastIp: invalid?.messageFor('lastIp') }}
        onSubmit={run}
      />
      {state.status === 'failed' && (
        <Alert variant="error" title="Calculation failed">
          {state.message}
        </Alert>
      )}
      {state.status === 'done' && <RangeSummaryResult summary={state.result} />}
    </CalculatorTemplate>
  )
}
