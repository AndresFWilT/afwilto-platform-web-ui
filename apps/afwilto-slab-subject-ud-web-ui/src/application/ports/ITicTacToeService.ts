export type TTTMark = 'X' | 'O'
export type TTTGameMode = 'HUMAN_VS_HUMAN' | 'HUMAN_VS_COMPUTER'
export type TTTGameStatus = 'IN_PROGRESS' | 'X_WINS' | 'O_WINS' | 'DRAW'

export interface TTTCell {
  row: number
  col: number
}

export interface TTTGameState {
  board: (TTTMark | null)[][]
  currentMark: TTTMark
  gameMode: TTTGameMode
  humanMark: TTTMark | null
  status: TTTGameStatus
  moveCount: number
}

export interface TTTMoveResult {
  state: TTTGameState
  computerMove: TTTCell | null
}

export interface ITicTacToeService {
  createMatch(mode: TTTGameMode, humanPlaysAs: TTTMark): Promise<TTTMoveResult>
  placeMove(state: TTTGameState, cell: TTTCell): Promise<TTTMoveResult>
}
