import type { Category } from '@/application/ports'

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

/** Case-insensitive name order, ties broken by id so the order is total. */
export function compareByName(a: { name: string; id: string }, b: { name: string; id: string }): number {
  return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

/**
 * Nests the flat GET /categories list by parentId (AC-F2). Siblings are sorted
 * by name at every level, so input order never matters. A node whose parent is
 * not in the list becomes a root rather than being dropped.
 */
export function buildCategoryTree(flat: Category[]): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>(flat.map((c) => [c.id, { ...c, children: [] }]))
  const roots: CategoryTreeNode[] = []

  for (const node of nodes.values()) {
    const parent = node.parentId === null ? undefined : nodes.get(node.parentId)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const sortLevel = (level: CategoryTreeNode[]): CategoryTreeNode[] => {
    level.sort(compareByName)
    level.forEach((n) => sortLevel(n.children))
    return level
  }
  return sortLevel(roots)
}

function findNode(tree: CategoryTreeNode[], id: string): CategoryTreeNode | undefined {
  for (const node of tree) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return undefined
}

/** The category and every descendant (AC-F13): never valid parents for it. Empty if unknown. */
export function descendantsOf(tree: CategoryTreeNode[], id: string): Set<string> {
  const ids = new Set<string>()
  const collect = (node: CategoryTreeNode) => {
    ids.add(node.id)
    node.children.forEach(collect)
  }
  const root = findNode(tree, id)
  if (root) collect(root)
  return ids
}

/** Levels in the subtree rooted at `id`: 1 for a leaf, 0 if unknown (BR-CAT3). */
export function subtreeHeight(tree: CategoryTreeNode[], id: string): number {
  const height = (node: CategoryTreeNode): number => 1 + Math.max(0, ...node.children.map(height))
  const root = findNode(tree, id)
  return root ? height(root) : 0
}
