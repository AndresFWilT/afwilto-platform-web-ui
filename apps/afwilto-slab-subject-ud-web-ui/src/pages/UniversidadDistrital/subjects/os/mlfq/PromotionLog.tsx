import { Text } from '@afwilto/design-system'
import type { MLFQExecutionStep, MLFQPromotion } from './types'
import { QUEUE_COLORS } from './types'

interface Props {
  steps: MLFQExecutionStep[]
}

export function PromotionLog({ steps }: Props) {
  const entries: Array<{ time: number; promotion: MLFQPromotion }> = []
  steps.forEach(step => {
    step.promotions.forEach(p => entries.push({ time: step.time, promotion: p }))
  })

  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <Text variant="small" weight="semibold" color="default">
        Promotion Log <span className="text-neutral-500 font-normal">({entries.length})</span>
      </Text>
      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {entries.map((entry, i) => (
          <PromotionEntry key={i} time={entry.time} promotion={entry.promotion} />
        ))}
      </div>
    </div>
  )
}

function PromotionEntry({ time, promotion }: { time: number; promotion: MLFQPromotion }) {
  const fromColor = QUEUE_COLORS[promotion.from]
  const toColor   = QUEUE_COLORS[promotion.to]
  const fromLabel = promotion.from === 'RoundRobin' ? 'RR' : promotion.from === 'ShortestJobFirst' ? 'SJF' : 'FCFS'
  const toLabel   = promotion.to   === 'RoundRobin' ? 'RR' : promotion.to   === 'ShortestJobFirst' ? 'SJF' : 'FCFS'

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono py-0.5">
      <span className="text-neutral-500 w-10 shrink-0">t={time}</span>
      <span className="font-bold text-neutral-300">P{promotion.pid}</span>
      <span className="px-1 rounded" style={{ backgroundColor: `${fromColor}22`, color: fromColor }}>{fromLabel}</span>
      <span className="text-neutral-500">→</span>
      <span className="px-1 rounded" style={{ backgroundColor: `${toColor}22`, color: toColor }}>{toLabel}</span>
      <span className="text-neutral-500">(aged {promotion.agingAtPromotion})</span>
    </div>
  )
}
