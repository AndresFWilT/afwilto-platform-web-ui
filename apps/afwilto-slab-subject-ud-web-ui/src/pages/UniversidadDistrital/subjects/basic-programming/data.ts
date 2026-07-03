export type BPCategory = 'Game Programming'

export interface BPProject {
  slug: string
  title: string
  description: string
  category: BPCategory
  concept: string
  gradientFrom: string
  gradientTo: string
}

export const BP_PROJECTS: BPProject[] = [
  {
    slug: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    description:
      'Human vs Human or Human vs unbeatable Minimax AI (alpha-beta pruning). Migrated from a buggy C++ console app with hardcoded 9-branch moves and a weak 1-move-lookahead AI into a clean Hexagonal Architecture on Quarkus.',
    category: 'Game Programming',
    concept: 'Minimax / Alpha-Beta Pruning',
    gradientFrom: '#1e1b4b',
    gradientTo: '#312e81',
  },
]

export const BP_CATEGORY_COLOR: Record<BPCategory, string> = {
  'Game Programming': '#818cf8',
}
