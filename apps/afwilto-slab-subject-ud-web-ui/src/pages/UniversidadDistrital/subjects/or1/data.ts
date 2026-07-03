export type OR1Category = 'LP' | 'MIP'

export interface OR1Project {
  slug: string
  title: string
  description: string
  detail: string
  category: OR1Category
  algorithm: string
  complexity: string
  gradientFrom: string
  gradientTo: string
}

export const OR1_PROJECTS: OR1Project[] = [
  {
    slug: 'graphical-method',
    title: 'Graphical Method',
    description:
      '2-variable LP solved by enumerating ALL pairwise constraint intersections — fixing the legacy bug that only checked adjacent pairs.',
    detail:
      'The graphical method finds the feasible region for a 2-variable linear program by computing every intersection of every constraint line pair (C(n,2) combinations), then filtering for feasibility and evaluating the objective at each vertex. Optional integer-variable rounding rounds each variable independently (the legacy rounded y to the value of x — a bug now corrected). Outputs the feasible region polygon, all labeled intersection points, and the optimal vertex annotated on a 2D chart.',
    category: 'LP',
    algorithm: 'Vertex Enumeration',
    complexity: 'O(C(n+2, 2))',
    gradientFrom: '#1e3a8a',
    gradientTo: '#1d4ed8',
  },
  {
    slug: 'mixed-integer',
    title: 'Mixed Integer Programming',
    description:
      'N-variable MIP solved with a genuine Simplex LP relaxation + Branch & Bound — not the hardcoded legacy responses.',
    detail:
      'Implements the standard Big-M Simplex method for LP relaxations, then wraps it in a depth-first Branch & Bound tree for integer-constrained variables. At each node the LP relaxation is solved; if any integer-constrained variable is fractional, the solver branches by adding x_i ≤ floor and x_i ≥ ceil constraints. Pruning eliminates sub-trees whose LP bounds cannot improve the current best integer solution.',
    category: 'MIP',
    algorithm: 'Simplex + Branch & Bound',
    complexity: 'NP-hard (exp. worst case)',
    gradientFrom: '#14532d',
    gradientTo: '#15803d',
  },
]

export const OR1_CATEGORY_COLOR: Record<OR1Category, string> = {
  LP:  '#3b82f6',
  MIP: '#22c55e',
}
