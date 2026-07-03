import { useState } from 'react'
import { Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { TTTGameMode, TTTGameState, TTTMark } from './types'
import { ModeSelector } from './ModeSelector'
import { GameBoard } from './GameBoard'
import { GameStatusDisplay } from './GameStatusDisplay'

export function TicTacToePage() {
  const { ticTacToeService } = useServices()

  const [phase, setPhase] = useState<'setup' | 'playing'>('setup')
  const [gameState, setGameState] = useState<TTTGameState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComputerThinking, setIsComputerThinking] = useState(false)

  async function handleStart(mode: TTTGameMode, humanMark: TTTMark) {
    setLoading(true); setError(null)
    try {
      const result = await ticTacToeService.createMatch(mode, humanMark)
      setGameState(result.state)
      setPhase('playing')
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to start.') }
    finally { setLoading(false) }
  }

  async function handleCellClick(row: number, col: number) {
    if (!gameState || gameState.status !== 'IN_PROGRESS') return
    setLoading(true); setError(null)
    try {
      const result = await ticTacToeService.placeMove(gameState, { row, col })
      setGameState(result.state)

      // Show "thinking" animation before AI move appears
      if (result.computerMove) {
        setIsComputerThinking(true)
        await delay(300)
        setIsComputerThinking(false)
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Move failed.') }
    finally { setLoading(false) }
  }

  function handleReset() {
    setPhase('setup')
    setGameState(null)
    setError(null)
    setIsComputerThinking(false)
  }

  if (phase === 'setup') {
    return <ModeSelector onStart={handleStart} loading={loading} error={error} />
  }

  const state = gameState!
  const isHvC = state.gameMode === 'HUMAN_VS_COMPUTER'
  const isHumanTurn = !isHvC || state.currentMark === state.humanMark
  const boardDisabled = loading || isComputerThinking || !isHumanTurn || state.status !== 'IN_PROGRESS'

  return (
    <div className="flex flex-col items-center gap-6">
      {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

      <GameStatusDisplay
        status={state.status}
        currentMark={state.currentMark}
        humanMark={state.humanMark}
        isComputerThinking={isComputerThinking}
        moveCount={state.moveCount}
        onReset={handleReset}
      />

      <GameBoard
        board={state.board}
        currentMark={state.currentMark}
        onCellClick={handleCellClick}
        disabled={boardDisabled}
      />
    </div>
  )
}

function delay(ms: number) { return new Promise(res => setTimeout(res, ms)) }
