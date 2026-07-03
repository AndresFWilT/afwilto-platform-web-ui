import { Text, Badge } from '@afwilto/design-system'
import type { ScrabbleGameState } from './types'

interface Props { state: ScrabbleGameState }

export function ScorePanel({ state }: Props) {
  const isOver = state.status === 'GAME_OVER'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Text variant="small" color="muted" weight="semibold">Scores</Text>
        <div className="flex items-center gap-2">
          <Badge variant={isOver ? 'error' : 'neutral'} size="sm">
            {isOver ? 'Game Over' : `Turn ${state.turnCount + 1}`}
          </Badge>
          <Text variant="caption" color="muted">{state.bag.length} tiles left</Text>
        </div>
      </div>

      {state.players.map((player, i) => {
        const isActive = i === state.activePlayerIndex && !isOver
        return (
          <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors ${
            isActive ? 'border-primary-500/60 bg-primary-500/10' : 'border-surface-border bg-surface-raised'
          }`}>
            <div className="flex items-center gap-2">
              {isActive && <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />}
              <Text variant="small" color={isActive ? 'default' : 'muted'} weight={isActive ? 'semibold' : 'normal'}>
                {player.name}
              </Text>
            </div>
            <Text variant="small" color="default" weight="semibold" className="font-mono">
              {player.score} pts
            </Text>
          </div>
        )
      })}
    </div>
  )
}
