import { Text } from '@afwilto/design-system'
import type { CursorState, CursorOperationResult } from '@/application/ports/IAVLCursorService'

interface AVLCursorTableProps {
  cursor: CursorState
  lastResult: CursorOperationResult | null
}

function letterSum(word: string): number {
  return word.toLowerCase().split('').reduce((sum, ch) => {
    const code = ch.charCodeAt(0) - 96
    return sum + (code >= 1 && code <= 26 ? code : 0)
  }, 0)
}

function bfLabel(bf: number) {
  if (bf === 1)  return { text: '+1', cls: 'text-amber-400' }
  if (bf === -1) return { text: '−1', cls: 'text-amber-400' }
  if (bf === 0)  return { text: '0',  cls: 'text-neutral-400' }
  return { text: String(bf), cls: 'text-red-400' }
}

export function AVLCursorTable({ cursor, lastResult }: AVLCursorTableProps) {
  const op = lastResult?.operation
  const highlightedIndex = op
    ? (op.type === 'INSERT' ? op.placedAtIndex : op.freedIndex) ?? null
    : null

  const rotationLabel: Record<string, string> = {
    ROTATE_LEFT: 'RL',
    ROTATE_RIGHT: 'RR',
    DOUBLE_ROTATE_LEFT: 'DRL',
    DOUBLE_ROTATE_RIGHT: 'DRR',
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Operation summary */}
      {op && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${op.type === 'INSERT' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
            {op.type}
          </span>
          <span className="text-neutral-200 font-mono">{op.key}</span>
          <span className="text-neutral-500">letterSum =</span>
          <span className="text-primary-400 font-mono font-bold">{op.letterSumKey}</span>
          {op.placedAtIndex !== undefined && (
            <span className="text-neutral-400">→ slot <span className="text-green-400 font-mono font-bold">[{op.placedAtIndex}]</span></span>
          )}
          {op.freedIndex !== undefined && (
            <span className="text-neutral-400">freed slot <span className="text-red-400 font-mono font-bold">[{op.freedIndex}]</span></span>
          )}
          {op.rotationsPerformed.length > 0 && (
            <span className="text-neutral-400">
              rotations:{' '}
              {op.rotationsPerformed.map((r, i) => (
                <span key={i} className="text-amber-400 font-mono font-bold ml-1">
                  {rotationLabel[r] ?? r}
                </span>
              ))}
            </span>
          )}
          {op.rotationsPerformed.length === 0 && (
            <span className="text-neutral-500 italic">no rotations</span>
          )}
        </div>
      )}

      {/* Cursor stats */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-400">
        <span>table: <span className="font-mono text-neutral-200">{cursor.name}</span></span>
        <span>capacity: <span className="font-mono text-neutral-200">{cursor.capacity}</span></span>
        <span>root: <span className="font-mono text-neutral-200">[{cursor.rootIndex}]</span></span>
        <span>nextFree: <span className="font-mono text-neutral-200">[{cursor.nextFreeSlot}]</span></span>
        <span>used: <span className="font-mono text-neutral-200">{cursor.slots.filter(s => s.index > 0 && s.key !== '').length} / {cursor.capacity - 1}</span></span>
      </div>

      {/* Slot table */}
      <div className="overflow-auto w-full" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ minWidth: '520px' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Idx', 'Key', 'ΣLetters', 'Left→', 'Right→', 'BF'].map(h => (
                  <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cursor.slots.map((slot) => {
                const isMeta = slot.index === 0
                const isRoot = slot.index === cursor.rootIndex && cursor.rootIndex !== 0
                const isEmpty = !isMeta && slot.key === ''
                const isHighlighted = slot.index === highlightedIndex && slot.index !== 0

                let rowCls = 'border-b border-surface-border/50 transition-colors'
                if (isHighlighted) rowCls += ' bg-amber-500/10'
                else if (isRoot)   rowCls += ' bg-primary-500/10'
                else if (isMeta)   rowCls += ' bg-surface-overlay/40'
                else if (isEmpty)  rowCls += ' opacity-40'

                const bf = bfLabel(slot.balanceFactor)

                return (
                  <tr key={slot.index} className={rowCls}>
                    {/* Index */}
                    <td className="py-1.5 px-3 font-mono text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        [{slot.index}]
                        {isRoot && <span className="text-[10px] text-primary-400 font-bold">ROOT</span>}
                        {isMeta && <span className="text-[10px] text-neutral-500">meta</span>}
                        {isHighlighted && (
                          <span className={`text-[10px] font-bold ${op?.type === 'INSERT' ? 'text-green-400' : 'text-red-400'}`}>
                            {op?.type === 'INSERT' ? '↑new' : '↓del'}
                          </span>
                        )}
                      </span>
                    </td>
                    {/* Key */}
                    <td className="py-1.5 px-3 font-mono">
                      {isMeta ? (
                        <span className="text-neutral-600 italic text-xs">—</span>
                      ) : slot.key ? (
                        <span className="text-neutral-100 font-semibold">{slot.key}</span>
                      ) : (
                        <span className="text-neutral-600 italic text-xs">free</span>
                      )}
                    </td>
                    {/* LetterSum */}
                    <td className="py-1.5 px-3 font-mono text-primary-400">
                      {slot.key && !isMeta ? letterSum(slot.key) : ''}
                    </td>
                    {/* Left */}
                    <td className="py-1.5 px-3 font-mono text-neutral-400">
                      {isMeta ? (
                        <span className="text-xs text-neutral-500">root=[{slot.leftIndex}]</span>
                      ) : (
                        slot.leftIndex !== 0 ? `[${slot.leftIndex}]` : <span className="text-neutral-700">∅</span>
                      )}
                    </td>
                    {/* Right */}
                    <td className="py-1.5 px-3 font-mono text-neutral-400">
                      {isMeta ? (
                        <span className="text-xs text-neutral-500">free=[{slot.rightIndex}]</span>
                      ) : (
                        slot.rightIndex !== 0 ? `[${slot.rightIndex}]` : <span className="text-neutral-700">∅</span>
                      )}
                    </td>
                    {/* Balance factor */}
                    <td className="py-1.5 px-3">
                      {!isMeta && slot.key && (
                        <span className={`font-mono font-bold text-xs ${bf.cls}`}>{bf.text}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Text variant="caption" color="muted">
        BF = balance factor (left height − right height). ±1 is balanced; 0 is perfectly balanced. Meta-slot [0] stores root and next-free pointers.
      </Text>
    </div>
  )
}
