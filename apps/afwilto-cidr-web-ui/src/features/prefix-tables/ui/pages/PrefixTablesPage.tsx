import { useCallback, useEffect, useState } from 'react'
import { Alert, Spinner, Text } from '@afwilto/design-system'
import type { IpFamily } from '@/cidr/domain/types'
import { useServices } from '@/shared/di'
import { useCalculation } from '@/shared/lib/useCalculation'
import { CalculatorTemplate } from '@/shared/ui/templates/CalculatorTemplate'
import { FamilyToggle } from '../molecules/FamilyToggle'
import { PrefixTableView } from '../organisms/PrefixTableView'

/** Spec 17 FR-5 / FR-7: the CIDR reference table of one family, from the API. */
export function PrefixTablesPage() {
  const { calculator } = useServices()
  const [family, setFamily] = useState<IpFamily>('ipv4')
  const load = useCallback((f: IpFamily) => calculator.prefixTable(f), [calculator])
  const { state, run } = useCalculation(load)

  useEffect(() => {
    void run(family)
  }, [run, family])

  return (
    <CalculatorTemplate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text variant="body" color="muted">
          Every prefix length with its block size, 2<sup>host bits</sup> addresses.
        </Text>
        <FamilyToggle value={family} onChange={setFamily} />
      </div>
      {state.status === 'pending' && <Spinner />}
      {state.status === 'failed' && (
        <Alert variant="error" title="Could not load the table">
          {state.message}
        </Alert>
      )}
      {state.status === 'done' && <PrefixTableView table={state.result} />}
    </CalculatorTemplate>
  )
}
