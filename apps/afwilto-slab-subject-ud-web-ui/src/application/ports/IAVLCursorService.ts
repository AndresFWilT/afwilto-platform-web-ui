export interface CursorSlot {
  index: number
  key: string
  leftIndex: number
  rightIndex: number
  balanceFactor: number
}

export interface CursorState {
  name: string
  capacity: number
  rootIndex: number
  nextFreeSlot: number
  slots: CursorSlot[]
}

export type RotationType =
  | 'ROTATE_LEFT'
  | 'ROTATE_RIGHT'
  | 'DOUBLE_ROTATE_LEFT'
  | 'DOUBLE_ROTATE_RIGHT'

export interface CursorOperationResult {
  cursor: CursorState
  operation: {
    type: 'INSERT' | 'DELETE'
    key: string
    letterSumKey: number
    placedAtIndex?: number
    freedIndex?: number
    rotationsPerformed: RotationType[]
  }
}

export interface IAVLCursorService {
  initialize(name: string, capacity: number): Promise<CursorState>
  insert(cursor: CursorState, key: string): Promise<CursorOperationResult>
  delete(cursor: CursorState, key: string): Promise<CursorOperationResult>
}
