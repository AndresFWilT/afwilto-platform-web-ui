import type { PieceCode } from './types'

interface Props { code: PieceCode; size?: number }

export function ChessPiece({ code, size = 48 }: Props) {
  const isWhite = code[0] === 'w'
  const type = code[1] as 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'
  return (
    <svg width={size} height={size} viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg">
      {PIECE_PATHS[type](isWhite)}
    </svg>
  )
}

type Renderer = (white: boolean) => React.ReactNode

const fill = (w: boolean) => (w ? '#fff' : '#202020')
const stroke = (w: boolean) => (w ? '#333' : '#ccc')

const PIECE_PATHS: Record<string, Renderer> = {
  K: (w) => (
    <g fill={fill(w)} stroke={stroke(w)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 11.63V6M20 8h5" strokeWidth="1.5" />
      <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
      <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-.5-2.5-3-2.5-3 2.5-3 2.5v6.5c-2.5-7.5-12-10.5-16-4-3 6 5 10.5 5 10.5z" />
      <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
    </g>
  ),
  Q: (w) => (
    <g fill={fill(w)} stroke={stroke(w)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="12" r="2.75" />
      <circle cx="14" cy="9" r="2.75" />
      <circle cx="22.5" cy="8" r="2.75" />
      <circle cx="31" cy="9" r="2.75" />
      <circle cx="39" cy="12" r="2.75" />
      <path d="M9 26c8.5-8.5 15.5-8.5 24 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 9.5 13.5z" />
      <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4" />
      <path d="M11.5 30c3.5-1 18.5-1 22 0" strokeWidth="1" />
      <path d="M12 33.5c4-1.5 17-1.5 21 0" strokeWidth="1" />
    </g>
  ),
  R: (w) => (
    <g fill={fill(w)} stroke={stroke(w)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 39h27v-3H9zM12 36v-4h21v4zm0-14v-4h5v-2H14V9h4V7h6v2h4v7h-3v2h5v4" />
      <path d="M14 29.5v-14h17v14H14z" />
    </g>
  ),
  B: (w) => (
    <g fill={fill(w)} stroke={stroke(w)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" />
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
    </g>
  ),
  N: (w) => (
    <g fill={fill(w)} stroke={stroke(w)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
      <path d="M24 18c.38 5.12-5.12 6.88-5 11.5.15 5.55 8.35 8 8 15H15c0-9 10-6.5 8-21" />
      <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill={stroke(w)} />
      <path d="M14.933 15.75a5 5 0 0 0-3.683 5c0 2 1 3.8 2 5" strokeWidth="1" />
    </g>
  ),
  P: (w) => (
    <g fill={fill(w)} stroke={stroke(w)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39h23c0-7.42-4.41-11.91-7.41-12.97C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
    </g>
  ),
}
