export type PM2Category = 'Game Programming'

export interface PM2Project {
  slug: string
  title: string
  description: string
  detail: string
  category: PM2Category
  concept: string
  gradientFrom: string
  gradientTo: string
}

export const PM2_PROJECTS: PM2Project[] = [
  {
    slug: 'chess',
    title: 'Chess',
    description:
      'Full two-player chess with complete rule enforcement: castling, en passant, pawn promotion, check/checkmate/stalemate detection, and pin validation. All 13 legacy bugs fixed. Stateless API — full board state travels in each request.',
    detail:
      'Migrated from a legacy Java Swing monolith (600-line god class, static shared state, 13 documented bugs) into a clean Hexagonal Architecture on Quarkus. The domain core is pure Java records with no framework imports. MoveGenerator computes pseudo-legal moves per piece; MoveValidator filters to legal moves by applying each move to a board copy and checking if the king is exposed. GameStateEvaluator determines check, checkmate, and stalemate in a single pass. The frontend holds the board state and sends it on every request — the backend is completely stateless.',
    category: 'Game Programming',
    concept: 'Hexagonal Architecture / Chess Engine',
    gradientFrom: '#0f172a',
    gradientTo: '#1e3a5f',
  },
]

export const PM2_CATEGORY_COLOR: Record<PM2Category, string> = {
  'Game Programming': '#8b5cf6',
}
