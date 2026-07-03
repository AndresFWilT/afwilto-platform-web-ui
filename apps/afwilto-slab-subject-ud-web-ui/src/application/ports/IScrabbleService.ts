export type CellMultiplier =
  | 'TRIPLE_WORD' | 'DOUBLE_WORD' | 'TRIPLE_LETTER' | 'DOUBLE_LETTER' | 'CENTER_STAR' | null

export interface ScrabbleTile {
  letter: string
  value: number
}

export interface ScrabblePlayer {
  name: string
  rack: ScrabbleTile[]
  score: number
}

export interface ScrabbleGameState {
  board: (string | null)[][]
  multipliers: (CellMultiplier)[][]
  bag: ScrabbleTile[]
  players: ScrabblePlayer[]
  activePlayerIndex: number
  turnCount: number
  consecutivePasses: number
  status: 'IN_PROGRESS' | 'GAME_OVER'
}

export interface TilePlacementRequest {
  row: number
  col: number
  letter: string
}

export interface WordFormed {
  word: string
  score: number
}

export interface PlaceResult {
  state: ScrabbleGameState
  wordsFormed: WordFormed[]
  turnScore: number
  isFirstTurn: boolean
}

export interface IScrabbleService {
  createMatch(players: string[]): Promise<ScrabbleGameState>
  place(state: ScrabbleGameState, placements: TilePlacementRequest[]): Promise<PlaceResult>
  pass(state: ScrabbleGameState): Promise<ScrabbleGameState>
  exchange(state: ScrabbleGameState, tileIndices: number[]): Promise<ScrabbleGameState>
}
