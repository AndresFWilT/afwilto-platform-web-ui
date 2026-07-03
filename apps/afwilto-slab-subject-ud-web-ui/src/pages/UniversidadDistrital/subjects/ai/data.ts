export type AICategory = 'Search Algorithms'

export interface AIProject {
  slug: string
  title: string
  description: string
  detail: string
  category: AICategory
  concept: string
  gradientFrom: string
  gradientTo: string
}

export const AI_PROJECTS: AIProject[] = [
  {
    slug: 'a-star',
    title: 'A* Pathfinding',
    description:
      'Optimal pathfinding on weighted directed graphs using f(n) = g(n) + h(n). Interactive graph builder, step-by-step expansion trace, frontier priority queue, and g/h/f cost table.',
    detail:
      'A* is the combination of Uniform-Cost Search (backward cost g(n)) and Greedy Best-First Search (forward heuristic h(n)). It is guaranteed optimal when h(n) is admissible (never overestimates the true cost). This implementation includes: a closed set to prevent re-expansion in cyclic graphs, early termination when the goal is popped from the frontier (not when first discovered), and predecessor tracking that only updates when a shorter path is found. Build any weighted directed graph, assign per-vertex heuristics, and watch A* explore step-by-step.',
    category: 'Search Algorithms',
    concept: 'A* / f(n) = g(n) + h(n)',
    gradientFrom: '#0f172a',
    gradientTo: '#1e3a5f',
  },
  {
    slug: 'depth-first-search',
    title: 'Depth-First Search',
    description:
      'Iterative DFS on unweighted directed graphs. Supports full traversal mode and goal-search mode with path reconstruction. Step-by-step stack state and visited sequence.',
    detail:
      'DFS explores as far as possible along each branch before backtracking, using an explicit stack (iterative, not recursive). Children are pushed in reverse order so the leftmost child is visited first — matching textbook left-to-right convention. Goal mode terminates early when the target vertex is found and reconstructs the path via predecessors. Cycle detection prevents infinite loops. Build a directed graph, optionally specify a goal vertex, and step through the stack evolution one vertex at a time.',
    category: 'Search Algorithms',
    concept: 'DFS / Stack / Backtracking',
    gradientFrom: '#1a0a2e',
    gradientTo: '#3b1f6e',
  },
]

export const AI_CATEGORY_COLOR: Record<AICategory, string> = {
  'Search Algorithms': '#6366f1',
}
