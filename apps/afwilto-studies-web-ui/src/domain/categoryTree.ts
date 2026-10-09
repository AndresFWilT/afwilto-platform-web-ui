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
