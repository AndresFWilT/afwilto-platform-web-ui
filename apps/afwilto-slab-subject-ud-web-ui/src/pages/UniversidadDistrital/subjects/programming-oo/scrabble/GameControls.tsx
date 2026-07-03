import { Button } from '@afwilto/design-system'

interface Props {
  hasPending: boolean
  isOver: boolean
  loading: boolean
  exchangeMode: boolean
  hasExchangeSelection: boolean
  onPlace: () => void
  onPass: () => void
  onToggleExchange: () => void
  onConfirmExchange: () => void
  onClearPending: () => void
}

export function GameControls({
  hasPending, isOver, loading, exchangeMode, hasExchangeSelection,
  onPlace, onPass, onToggleExchange, onConfirmExchange, onClearPending,
}: Props) {
  if (isOver) return null

  if (exchangeMode) {
    return (
      <div className="flex gap-2">
        <Button variant="primary" size="sm" loading={loading} onClick={onConfirmExchange}
          disabled={!hasExchangeSelection}>
          Confirm Exchange
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleExchange}>Cancel</Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button variant="primary" size="sm" loading={loading} onClick={onPlace} disabled={!hasPending}>
        Place Word
      </Button>
      {hasPending && (
        <Button variant="ghost" size="sm" onClick={onClearPending}>Clear</Button>
      )}
      <Button variant="secondary" size="sm" loading={loading} onClick={onPass} disabled={hasPending}>
        Pass
      </Button>
      <Button variant="ghost" size="sm" onClick={onToggleExchange} disabled={hasPending}>
        Exchange
      </Button>
    </div>
  )
}
