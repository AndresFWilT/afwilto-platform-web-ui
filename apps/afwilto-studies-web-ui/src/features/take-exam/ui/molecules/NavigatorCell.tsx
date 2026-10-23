import { cellLabel, cellState, type AttemptItem, type CellState } from '@/exams/domain'

const STATES: Record<CellState, { icon: string; tone: string }> = {
  blank: { icon: '', tone: 'border-surface-border bg-surface-raised text-neutral-300' },
  answered: { icon: '●', tone: 'border-primary-500 bg-primary-500/15 text-primary-100' },
  flagged: { icon: '⚑', tone: 'border-amber-500 bg-amber-500/10 text-amber-200' },
  'answered-flagged': { icon: '●⚑', tone: 'border-amber-500 bg-primary-500/15 text-amber-100' },
}

interface Props {
  item: Pick<AttemptItem, 'position' | 'answered' | 'flagged'>
  current: boolean
  saving: boolean
  onSelect: (position: number) => void
}

/** One numbered cell of the navigator: state as icon + colour + an `aria-label` in words. */
export function NavigatorCell({ item, current, saving, onSelect }: Props) {
  const { icon, tone } = STATES[cellState(item)]
  return (
    <button
      type="button"
      aria-label={cellLabel(item)}
      aria-current={current ? 'step' : undefined}
      aria-busy={saving ? true : undefined}
      onClick={() => onSelect(item.position)}
      className={`relative flex h-10 min-w-10 flex-col items-center justify-center rounded-md border text-xs font-semibold ${tone} ${current ? 'ring-2 ring-primary-300' : ''}`}
    >
      <span aria-hidden="true">{item.position + 1}</span>
      {saving ? (
        <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-500 border-t-primary-300" />
      ) : (
        <span aria-hidden="true" className="text-[0.65rem] leading-none">{icon || ' '}</span>
      )}
    </button>
  )
}
