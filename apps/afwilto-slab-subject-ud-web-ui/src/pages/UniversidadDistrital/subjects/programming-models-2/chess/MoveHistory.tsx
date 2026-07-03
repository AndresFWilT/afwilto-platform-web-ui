import { useEffect, useRef } from 'react'
import { Text } from '@afwilto/design-system'
import type { ChessMove, PieceCode } from './types'

interface HistoryEntry {
  move: ChessMove
  piece: PieceCode
  captured: PieceCode | null
  moveNumber: number
  isWhite: boolean
}

interface Props { history: HistoryEntry[] }

const FILES = 'abcdefgh'

function toAlgebraic(entry: HistoryEntry): string {
  const type = entry.piece[1]
  const capture = entry.captured ? 'x' : ''
  const to   = FILES[entry.move.to.col] + (8 - entry.move.to.row)
  const promo = entry.move.promotion ? `=${entry.move.promotion}` : ''
  const prefix = type === 'P' ? (capture ? FILES[entry.move.from.col] : '') : type
  return `${prefix}${capture}${to}${promo}`
}

export function MoveHistory({ history }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [history.length])

  const paired: [HistoryEntry, HistoryEntry | null][] = []
  for (let i = 0; i < history.length; i += 2) {
    paired.push([history[i], history[i + 1] ?? null])
  }

  return (
    <div className="flex flex-col gap-2">
      <Text variant="small" color="muted" weight="semibold">Move History</Text>
      <div ref={ref} className="overflow-y-auto max-h-48 flex flex-col gap-0.5 pr-1"
        style={{ scrollbarWidth: 'thin' }}>
        {paired.length === 0 && (
          <Text variant="caption" color="muted">No moves yet.</Text>
        )}
        {paired.map(([white, black], i) => (
          <div key={i} className="flex items-center gap-2 py-0.5 border-b border-surface-border/50">
            <span className="text-neutral-500 font-mono text-xs w-6 shrink-0">{i + 1}.</span>
            <span className="font-mono text-xs text-neutral-200 flex-1">{toAlgebraic(white)}</span>
            {black && <span className="font-mono text-xs text-neutral-400 flex-1">{toAlgebraic(black)}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export type { HistoryEntry }
