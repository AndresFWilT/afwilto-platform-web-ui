import { useState } from 'react'
import { Alert, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { ChessMove, GameState, GameStatus, MatchState, PieceCode, Players, PromotionPiece, Square } from './types'
import { PlayerSetup } from './PlayerSetup'
import { ChessBoard } from './ChessBoard'
import { GameInfoPanel } from './GameInfoPanel'
import { MoveHistory, type HistoryEntry } from './MoveHistory'
import { PromotionDialog } from './PromotionDialog'

export function ChessPage() {
  const { chessService } = useServices()

  const [phase, setPhase] = useState<'setup' | 'playing'>('setup')
  const [matchState, setMatchState] = useState<MatchState | null>(null)
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalMoves, setLegalMoves] = useState<ChessMove[]>([])
  const [lastMove, setLastMove] = useState<ChessMove | null>(null)
  const [captured, setCaptured] = useState<PieceCode[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<ChessMove | null>(null)

  async function handleStart(white: string, black: string) {
    setLoading(true)
    setError(null)
    try {
      const match = await chessService.createMatch(white, black)
      setMatchState(match)
      setPhase('playing')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start game.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSquareClick(sq: Square) {
    if (!matchState) return
    const state = matchState.state
    const status = matchState.status

    if (status === 'CHECKMATE' || status === 'STALEMATE' || status === 'DRAW') return

    const clickedPiece = state.board[sq.row][sq.col] as PieceCode | null
    const isMyPiece = clickedPiece && clickedPiece[0] === (state.activeColor === 'WHITE' ? 'w' : 'b')

    // If a legal target is clicked, make the move
    if (selectedSquare && legalMoves.some(m => m.to.row === sq.row && m.to.col === sq.col)) {
      const move: ChessMove = { from: selectedSquare, to: sq }
      // Check if promotion needed
      const piece = state.board[selectedSquare.row][selectedSquare.col] as PieceCode | null
      const isPromotion = piece?.[1] === 'P' && (
        (piece[0] === 'w' && sq.row === 0) || (piece[0] === 'b' && sq.row === 7)
      )
      if (isPromotion) {
        setPendingPromotion(move)
        return
      }
      await executeMove(move, state, matchState.players, status)
      return
    }

    // Select own piece
    if (isMyPiece) {
      setError(null)
      setSelectedSquare(sq)
      setLoading(true)
      try {
        const moves = await chessService.getLegalMoves(state, sq)
        setLegalMoves(moves)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not fetch moves.')
        setLegalMoves([])
        setSelectedSquare(null)
      } finally {
        setLoading(false)
      }
      return
    }

    // Click elsewhere — deselect
    setSelectedSquare(null)
    setLegalMoves([])
  }

  async function executeMove(move: ChessMove, state: GameState, players: Players, _prevStatus: GameStatus) {
    setLoading(true)
    setError(null)
    setSelectedSquare(null)
    setLegalMoves([])
    try {
      const result = await chessService.makeMove(state, move)
      const piece = state.board[move.from.row][move.from.col] as PieceCode
      const entry: HistoryEntry = {
        move,
        piece,
        captured: result.capturedPiece,
        moveNumber: state.fullmoveNumber,
        isWhite: state.activeColor === 'WHITE',
      }
      setLastMove(move)
      if (result.capturedPiece) setCaptured(prev => [...prev, result.capturedPiece!])
      setHistory(prev => [...prev, entry])
      setMatchState({ state: result.state, players, status: result.status })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Move failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePromotion(promotion: PromotionPiece) {
    if (!pendingPromotion || !matchState) return
    const move: ChessMove = { ...pendingPromotion, promotion }
    setPendingPromotion(null)
    await executeMove(move, matchState.state, matchState.players, matchState.status)
  }

  function handleNewGame() {
    setPhase('setup')
    setMatchState(null)
    setSelectedSquare(null)
    setLegalMoves([])
    setLastMove(null)
    setCaptured([])
    setHistory([])
    setError(null)
    setPendingPromotion(null)
  }

  if (phase === 'setup') {
    return (
      <PlayerSetup
        onStart={handleStart}
        loading={loading}
        error={error}
      />
    )
  }

  const state = matchState!.state
  const players = matchState!.players
  const status = matchState!.status
  const isOver = status === 'CHECKMATE' || status === 'STALEMATE' || status === 'DRAW'

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Board */}
        <div className="relative w-full lg:max-w-[560px] shrink-0">
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 rounded">
              <Spinner size="lg" />
            </div>
          )}
          <ChessBoard
            state={state}
            status={status}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            isFlipped={isFlipped}
            onSquareClick={handleSquareClick}
          />
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-64 flex flex-col gap-4">
          <GameInfoPanel
            activeColor={state.activeColor}
            players={players}
            status={status}
            captured={captured}
            fullmoveNumber={state.fullmoveNumber}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(f => !f)}
          />
          <MoveHistory history={history} />
          {isOver && (
            <button
              onClick={handleNewGame}
              className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
            >
              New Game
            </button>
          )}
        </div>
      </div>

      {pendingPromotion && (
        <PromotionDialog
          color={state.activeColor}
          onSelect={handlePromotion}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </div>
  )
}
