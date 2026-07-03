import { useState } from 'react'
import { Text, Button, Card } from '@afwilto/design-system'
import type { TTTGameMode, TTTMark } from './types'

interface Props {
  onStart: (mode: TTTGameMode, humanMark: TTTMark) => void
  loading: boolean
  error: string | null
}

export function ModeSelector({ onStart, loading, error }: Props) {
  const [mode, setMode] = useState<TTTGameMode>('HUMAN_VS_COMPUTER')
  const [mark, setMark] = useState<TTTMark>('X')

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
      <div className="flex flex-col gap-1 text-center">
        <Text variant="h3" color="default">Tic Tac Toe</Text>
        <Text variant="body" color="muted">Minimax AI with alpha-beta pruning — it never loses.</Text>
      </div>

      <Card padding="lg" className="w-full max-w-sm flex flex-col gap-5">
        {/* Mode */}
        <div className="flex flex-col gap-2">
          <Text variant="small" color="muted" weight="semibold">Game Mode</Text>
          <div className="flex gap-2">
            {(['HUMAN_VS_COMPUTER', 'HUMAN_VS_HUMAN'] as TTTGameMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  mode === m
                    ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                    : 'border-surface-border text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {m === 'HUMAN_VS_COMPUTER' ? 'vs Computer' : '2 Players'}
              </button>
            ))}
          </div>
        </div>

        {/* Mark selection (only relevant for HvC) */}
        {mode === 'HUMAN_VS_COMPUTER' && (
          <div className="flex flex-col gap-2">
            <Text variant="small" color="muted" weight="semibold">Play as</Text>
            <div className="flex gap-2">
              {(['X', 'O'] as TTTMark[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMark(m)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-colors ${
                    mark === m
                      ? m === 'X'
                        ? 'border-error-500 bg-error-500/15 text-error-300'
                        : 'border-primary-500 bg-primary-500/15 text-primary-300'
                      : 'border-surface-border text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {m} {m === 'X' ? '(goes first)' : '(goes second)'}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <Text variant="caption" color="default" className="text-error-400">{error}</Text>}

        <Button variant="primary" size="lg" fullWidth loading={loading} onClick={() => onStart(mode, mark)}>
          Start Game
        </Button>
      </Card>
    </div>
  )
}
