import type { IHttpClient } from '@/application/ports'
import type {
  ITicTacToeService,
  TTTCell,
  TTTGameMode,
  TTTGameState,
  TTTMark,
  TTTMoveResult,
} from '@/application/ports/ITicTacToeService'

type ApiResponse<T> = { data: T }

export class TicTacToeHttpAdapter implements ITicTacToeService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async createMatch(mode: TTTGameMode, humanPlaysAs: TTTMark): Promise<TTTMoveResult> {
    try {
      const res = await this.http.post<ApiResponse<TTTMoveResult>>(
        '/api/v1/tictactoe/match', { mode, humanPlaysAs }
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async placeMove(state: TTTGameState, cell: TTTCell): Promise<TTTMoveResult> {
    try {
      const res = await this.http.post<ApiResponse<TTTMoveResult>>(
        '/api/v1/tictactoe/move', { state, cell }
      )
      return res.data
    } catch (e) { throw translate(e) }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('CELL_OCCUPIED'))  return new Error('That cell is already taken.')
  if (msg.includes('GAME_OVER'))      return new Error('The game is already over.')
  if (msg.includes('INVALID_CELL'))   return new Error('Invalid cell position.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the backend — is programming-mngr running on :8091?')
  return e
}
