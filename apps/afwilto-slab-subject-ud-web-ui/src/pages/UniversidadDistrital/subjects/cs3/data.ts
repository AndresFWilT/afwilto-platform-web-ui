export type CS3Category = 'Algorithms' | 'Logic'

export interface CS3Project {
  slug: string
  title: string
  titleEs: string
  description: string
  detail: string
  category: CS3Category
  timeComplexity: string
  spaceComplexity: string
  concepts: string[]
  gradientFrom: string
  gradientTo: string
}

export const CS3_PROJECTS: CS3Project[] = [
  {
    slug: 'critical-path',
    title: 'Critical Path Method',
    titleEs: 'Método de la Ruta Crítica (CPM)',
    description: 'Project scheduling via forward/backward pass on a dependency DAG. Identifies the longest path that determines minimum project duration.',
    detail: 'CPM (Critical Path Method) is a project management algorithm that models tasks as nodes in a directed acyclic graph. A forward pass computes earliest start/finish times; a backward pass computes latest times. Activities with zero slack are on the critical path — any delay propagates directly to the project end date. Ported from the legacy Java/Swing implementation with proper cycle detection (Kahn\'s topological sort), explicit predecessor arrays (fixing the concatenated-char bug), and clean hexagonal layering.',
    category: 'Algorithms',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    concepts: ['DAG scheduling', 'Forward/backward pass', 'Slack calculation', 'Topological sort'],
    gradientFrom: '#1e3a8a',
    gradientTo: '#1d4ed8',
  },
  {
    slug: 'truth-table',
    title: 'Truth Table Generator',
    titleEs: 'Generador de Tablas de Verdad',
    description: 'Evaluates propositional logic formulas over all truth assignments. Classifies as tautology, contradiction, or contingency.',
    detail: 'Given a propositional formula (∧ AND, ∨ OR, ¬ NOT, → IMPLIES, ↔ BICONDITIONAL), generates all 2ⁿ truth-value combinations and evaluates the formula for each. Built with a proper shunting-yard parser with precedence (NOT > AND > OR > → > ↔), parenthesis validation, and stack-based postfix evaluation. Variables are auto-detected (not hardcoded to p, q, r). Adds classification (tautology / contradiction / contingency) missing from the legacy.',
    category: 'Logic',
    timeComplexity: 'O(2ⁿ)',
    spaceComplexity: 'O(2ⁿ)',
    concepts: ['Propositional logic', 'Shunting-yard algorithm', 'Tautology/contradiction', 'Postfix evaluation'],
    gradientFrom: '#4c1d95',
    gradientTo: '#7c3aed',
  },
]

export const CS3_CATEGORY_COLOR: Record<CS3Category, string> = {
  Algorithms: '#3b82f6',
  Logic:      '#8b5cf6',
}
