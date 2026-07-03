import { useState } from 'react'
import { Alert, Spinner, Text } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { ScrabbleGameState, ScrabbleTile, TilePlacementRequest, WordFormed } from './types'
import { PlayerSetup } from './PlayerSetup'
import { ScrabbleBoard } from './ScrabbleBoard'
import { TileRack } from './TileRack'
import { ScorePanel } from './ScorePanel'
import { WordsFormedPanel } from './WordsFormedPanel'
import { GameControls } from './GameControls'

interface PendingPlacement { row: number; col: number; tileIndex: number; tile: ScrabbleTile }

export function ScrabblePage() {
  const { scrabbleService } = useServices()

  const [phase, setPhase] = useState<'setup' | 'playing'>('setup')
  const [gameState, setGameState] = useState<ScrabbleGameState | null>(null)
  const [selectedRackIndex, setSelectedRackIndex] = useState<number | null>(null)
  const [pending, setPending] = useState<PendingPlacement[]>([])
  const [lastWords, setLastWords] = useState<WordFormed[]>([])
  const [lastTurnScore, setLastTurnScore] = useState(0)
  const [lastIsFirstTurn, setLastIsFirstTurn] = useState(false)
  const [exchangeMode, setExchangeMode] = useState(false)
  const [exchangeIndices, setExchangeIndices] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart(players: string[]) {
    setLoading(true); setError(null)
    try {
      const state = await scrabbleService.createMatch(players)
      setGameState(state); setPhase('playing')
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to start.') }
    finally { setLoading(false) }
  }

  function handleRackSelect(index: number) {
    if (exchangeMode) {
      setExchangeIndices(prev => {
        const next = new Set(prev)
        next.has(index) ? next.delete(index) : next.add(index)
        return next
      })
      return
    }
    setSelectedRackIndex(prev => prev === index ? null : index)
  }

  function handleCellClick(row: number, col: number) {
    if (!gameState) return
    if (gameState.board[row][col] !== null) return
    if (pending.some(p => p.row === row && p.col === col)) {
      setPending(prev => prev.filter(p => !(p.row === row && p.col === col)))
      return
    }
    if (selectedRackIndex === null) return
    const alreadyUsed = pending.some(p => p.tileIndex === selectedRackIndex)
    if (alreadyUsed) return

    const activeRack = gameState.players[gameState.activePlayerIndex].rack
    const tile = activeRack[selectedRackIndex]
    if (!tile) return

    setPending(prev => [...prev, { row, col, tileIndex: selectedRackIndex, tile }])
    setSelectedRackIndex(null)
  }

  async function handlePlace() {
    if (!gameState || pending.length === 0) return
    setLoading(true); setError(null)
    const placements: TilePlacementRequest[] = pending.map(p => ({
      row: p.row, col: p.col, letter: p.tile.letter,
    }))
    try {
      const result = await scrabbleService.place(gameState, placements)
      setGameState(result.state)
      setLastWords(result.wordsFormed)
      setLastTurnScore(result.turnScore)
      setLastIsFirstTurn(result.isFirstTurn)
      setPending([])
      setSelectedRackIndex(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Placement failed.') }
    finally { setLoading(false) }
  }

  async function handlePass() {
    if (!gameState) return
    setLoading(true); setError(null)
    try {
      const next = await scrabbleService.pass(gameState)
      setGameState(next); setLastWords([]); setPending([])
    } catch (e) { setError(e instanceof Error ? e.message : 'Pass failed.') }
    finally { setLoading(false) }
  }

  async function handleExchange() {
    if (!gameState || exchangeIndices.size === 0) return
    setLoading(true); setError(null)
    try {
      const next = await scrabbleService.exchange(gameState, [...exchangeIndices])
      setGameState(next)
      setExchangeMode(false); setExchangeIndices(new Set()); setLastWords([])
    } catch (e) { setError(e instanceof Error ? e.message : 'Exchange failed.') }
    finally { setLoading(false) }
  }

  if (phase === 'setup') {
    return <PlayerSetup onStart={handleStart} loading={loading} error={error} />
  }

  const state = gameState!
  const active = state.players[state.activePlayerIndex]
  const isOver = state.status === 'GAME_OVER'

  const selectedIndices = new Set([
    ...pending.map(p => p.tileIndex),
    ...(selectedRackIndex !== null ? [selectedRackIndex] : []),
  ])

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {/* Board */}
        <div className="relative w-full xl:max-w-[600px] shrink-0">
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 rounded">
              <Spinner size="lg" />
            </div>
          )}
          <ScrabbleBoard
            board={state.board}
            multipliers={state.multipliers}
            pending={pending.map(p => ({ row: p.row, col: p.col, tile: p.tile }))}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Side panel */}
        <div className="w-full xl:w-72 flex flex-col gap-4">
          <ScorePanel state={state} />

          {!isOver && (
            <TileRack
              tiles={active.rack}
              selectedIndices={exchangeMode ? exchangeIndices : selectedIndices}
              onSelect={handleRackSelect}
              label={active.name}
            />
          )}

          <GameControls
            hasPending={pending.length > 0}
            isOver={isOver}
            loading={loading}
            exchangeMode={exchangeMode}
            hasExchangeSelection={exchangeIndices.size > 0}
            onPlace={handlePlace}
            onPass={handlePass}
            onToggleExchange={() => { setExchangeMode(e => !e); setExchangeIndices(new Set()) }}
            onConfirmExchange={handleExchange}
            onClearPending={() => { setPending([]); setSelectedRackIndex(null) }}
          />

          {exchangeMode && (
            <Text variant="caption" color="muted">
              Select tiles to exchange, then click "Confirm Exchange".
            </Text>
          )}

          <WordsFormedPanel words={lastWords} turnScore={lastTurnScore} isFirstTurn={lastIsFirstTurn} />

          {isOver && (
            <div className="rounded-lg p-3 border border-primary-500/40 bg-primary-500/10 text-center flex flex-col gap-2">
              <Text variant="small" color="default" weight="semibold">Game Over</Text>
              {[...state.players].sort((a, b) => b.score - a.score).map((p, i) => (
                <Text key={i} variant="caption" color={i === 0 ? 'default' : 'muted'}>
                  {i === 0 ? '🏆 ' : ''}{p.name}: {p.score} pts
                </Text>
              ))}
              <button
                onClick={() => { setPhase('setup'); setGameState(null); setPending([]); setLastWords([]) }}
                className="mt-1 text-sm text-primary-400 hover:text-primary-200 transition-colors"
              >
                New Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
