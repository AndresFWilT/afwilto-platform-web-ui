export type PieceCode =
  | 'wK' | 'wQ' | 'wR' | 'wB' | 'wN' | 'wP'
  | 'bK' | 'bQ' | 'bR' | 'bB' | 'bN' | 'bP'

export type PieceColor = 'WHITE' | 'BLACK'
export type GameStatus = 'IN_PROGRESS' | 'CHECK' | 'CHECKMATE' | 'STALEMATE' | 'DRAW'
export type PromotionPiece = 'Q' | 'R' | 'B' | 'N'

export interface Square {
  row: number
  col: number
}

export interface ChessMove {
  from: Square
  to: Square
  promotion?: PromotionPiece
}

export interface CastlingRights {
  whiteKingside: boolean
  whiteQueenside: boolean
  blackKingside: boolean
  blackQueenside: boolean
}

export interface GameState {
  board: (PieceCode | null)[][]
  activeColor: PieceColor
  castlingRights: CastlingRights
  enPassantTarget: Square | null
  halfmoveClock: number
  fullmoveNumber: number
}

export interface Players {
  white: string
  black: string
}

export interface MatchState {
  state: GameState
  players: Players
  status: GameStatus
}

export interface MoveResult {
  state: GameState
  status: GameStatus
  capturedPiece: PieceCode | null
  isCheck: boolean
}

export interface IChessService {
  createMatch(white: string, black: string): Promise<MatchState>
  getLegalMoves(state: GameState, square: Square): Promise<ChessMove[]>
  makeMove(state: GameState, move: ChessMove): Promise<MoveResult>
}
