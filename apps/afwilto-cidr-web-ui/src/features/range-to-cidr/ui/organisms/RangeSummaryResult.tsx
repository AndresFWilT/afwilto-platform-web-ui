import type { RangeSummary } from '@/cidr/domain/types'
import { BlockList } from '@/shared/ui/molecules/BlockList'
import { ResultPanel } from '@/shared/ui/organisms/ResultPanel'

export function RangeSummaryResult({ summary }: { summary: RangeSummary }) {
  return (
    <ResultPanel
      entries={[
        { label: 'First IP', value: summary.firstIp },
        { label: 'Last IP', value: summary.lastIp },
        { label: 'Blocks', value: String(summary.blockCount) },
      ]}
    >
      <BlockList blocks={summary.blocks} />
    </ResultPanel>
  )
}
