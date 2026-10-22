import { Alert, Text } from '@afwilto/design-system'
import { useServices } from '@/shared/di'
import { useCalculation } from '@/shared/lib/useCalculation'
import { CalculatorTemplate } from '@/shared/ui/templates/CalculatorTemplate'
import { CidrRangeForm } from '../organisms/CidrRangeForm'
import { CidrRangeResult } from '../organisms/CidrRangeResult'

/** Spec 17 FR-2 / FR-7: one CIDR in, its whole address range out. */
export function CidrToRangePage() {
  const { calculator } = useServices()
  const { state, run } = useCalculation((cidr: string) => calculator.calculateRange(cidr))

  return (
    <CalculatorTemplate>
      <Text variant="body" color="muted">
        Enter an IPv4 or IPv6 block. Host bits are allowed and are cleared to the network address.
      </Text>
      <CidrRangeForm
        pending={state.status === 'pending'}
        serverError={state.status === 'invalid' ? (state.error.messageFor('cidr') ?? state.error.message) : undefined}
        onSubmit={run}
      />
      {state.status === 'failed' && (
        <Alert variant="error" title="Calculation failed">
          {state.message}
        </Alert>
      )}
      {state.status === 'done' && <CidrRangeResult range={state.result} />}
    </CalculatorTemplate>
  )
}
