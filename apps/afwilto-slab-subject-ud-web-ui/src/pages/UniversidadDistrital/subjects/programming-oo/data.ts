export type OOCategory = 'Game Programming'

export interface OOProject {
  slug: string
  title: string
  description: string
  detail: string
  category: OOCategory
  concept: string
  gradientFrom: string
  gradientTo: string
}

export const OO_PROJECTS: OOProject[] = [
  {
    slug: 'scrabble',
    title: 'Scrabble',
    description:
      'Two-player Spanish Scrabble on a 15×15 board with full rule enforcement: placement validation, word scoring with all multipliers, 7-tile bingo bonus, exchange tiles, and consecutive-pass game-over detection. Eliminates the legacy 18,000-line god class.',
    detail:
      'Migrated from VentanaPrincipal.java — a single class with 225 individually declared JButtons and 14 individual tile variables. The migration converts the board to a data-driven loop (15 lines replace 18,000), the rack to a List<Tile>, and the scoring to a clean domain service. PlacementValidator enforces linearity, connectivity, center-start, and gap rules. WordExtractor finds all cross-words formed by a placement. ScoreCalculator handles letter and word multipliers including the double-word center star.',
    category: 'Game Programming',
    concept: 'OOP / Scrabble Engine',
    gradientFrom: '#14532d',
    gradientTo: '#052e16',
  },
]

export const OO_CATEGORY_COLOR: Record<OOCategory, string> = {
  'Game Programming': '#22c55e',
}
