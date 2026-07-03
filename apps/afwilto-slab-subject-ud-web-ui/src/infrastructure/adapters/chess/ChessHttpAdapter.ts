import type { IHttpClient } from '@/application/ports'
import type {
  ChessMove,
  GameState,
  IChessService,
  MatchState,
  MoveResult,
  Square,
} from '@/application/ports/IChessService'

type ApiResponse<T> = { data: T }

export class ChessHttpAdapter implements IChessService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async createMatch(white: string, black: string): Promise<MatchState> {
    try {
      const res = await this.http.post<ApiResponse<MatchState>>(
        '/api/v1/chess/match',
        { white, black },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async getLegalMoves(state: GameState, square: Square): Promise<ChessMove[]> {
    try {
      const res = await this.http.post<ApiResponse<{ moves: ChessMove[] }>>(
        '/api/v1/chess/legal-moves',
        { state, square },
      )
      return res.data.moves
    } catch (e) { throw translate(e) }
  }

  async makeMove(state: GameState, move: ChessMove): Promise<MoveResult> {
    try {
      const res = await this.http.post<ApiResponse<MoveResult>>(
        '/api/v1/chess/move',
        { state, move },
      )
      return res.data
    } catch (e) { throw translate(e) }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('ILLEGAL_MOVE'))       return new Error('That move is not legal.')
  if (msg.includes('NOT_YOUR_PIECE'))     return new Error('Select one of your own pieces.')
  if (msg.includes('PROMOTION_REQUIRED')) return new Error('Choose a promotion piece.')
  if (msg.includes('GAME_OVER'))          return new Error('The game has already ended.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the chess service — is programming-mngr running on :8091?')
  return e
}
