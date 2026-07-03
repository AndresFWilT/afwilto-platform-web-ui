import type { IHttpClient } from '@/application/ports'
import type {
  IScrabbleService,
  PlaceResult,
  ScrabbleGameState,
  TilePlacementRequest,
} from '@/application/ports/IScrabbleService'

type ApiResponse<T> = { data: T }

export class ScrabbleHttpAdapter implements IScrabbleService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) { this.http = http }

  async createMatch(players: string[]): Promise<ScrabbleGameState> {
    try {
      const res = await this.http.post<ApiResponse<ScrabbleGameState>>(
        '/api/v1/scrabble/match', { players }
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async place(state: ScrabbleGameState, placements: TilePlacementRequest[]): Promise<PlaceResult> {
    try {
      const res = await this.http.post<ApiResponse<PlaceResult>>(
        '/api/v1/scrabble/place', { state, placements }
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async pass(state: ScrabbleGameState): Promise<ScrabbleGameState> {
    try {
      const res = await this.http.post<ApiResponse<ScrabbleGameState>>(
        '/api/v1/scrabble/pass', { state }
      )
      return res.data
    } catch (e) { throw translate(e) }
  }

  async exchange(state: ScrabbleGameState, tileIndices: number[]): Promise<ScrabbleGameState> {
    try {
      const res = await this.http.post<ApiResponse<ScrabbleGameState>>(
        '/api/v1/scrabble/exchange', { state, tileIndices }
      )
      return res.data
    } catch (e) { throw translate(e) }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const msg = e.message
  if (msg.includes('INVALID_PLACEMENT'))   return new Error(msg.split(':').slice(1).join(':').trim())
  if (msg.includes('CENTER_NOT_COVERED'))  return new Error('First word must cross the center star.')
  if (msg.includes('CELL_OCCUPIED'))       return new Error('That cell is already occupied.')
  if (msg.includes('TILE_NOT_IN_RACK'))    return new Error('You don\'t have that tile in your rack.')
  if (msg.includes('GAME_OVER'))           return new Error('The game has already ended.')
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError'))
    return new Error('Cannot reach the Scrabble service — is programming-mngr running on :8091?')
  return e
}
