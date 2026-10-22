import type { Aggregation } from '@/cidr/domain/types'
import { BlockList } from '@/shared/ui/molecules/BlockList'
import { ResultPanel } from '@/shared/ui/organisms/ResultPanel'

export function AggregationResult({ aggregation }: { aggregation: Aggregation }) {
  return (
    <ResultPanel
      entries={[
        { label: 'Addresses entered', value: String(aggregation.inputCount) },
        { label: 'Unique addresses', value: String(aggregation.uniqueCount) },
        { label: 'Blocks', value: String(aggregation.blockCount) },
      ]}
    >
      <BlockList blocks={aggregation.blocks} />
    </ResultPanel>
  )
}
