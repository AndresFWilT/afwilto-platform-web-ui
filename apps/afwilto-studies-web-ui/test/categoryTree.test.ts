import { describe, it, expect } from 'vitest'
import { buildCategoryTree, descendantsOf, subtreeHeight, type CategoryTreeNode } from '../src/domain/categoryTree'
import type { Category } from '../src/application/ports'

function cat(id: string, name: string, parentId: string | null = null): Category {
  return { id, parentId, name, color: '#3B82F6', path: name, depth: 1, subjectCount: 0 }
}

// Shape-only view, so assertions read as the tree itself.
function shape(nodes: CategoryTreeNode[]): unknown[] {
  return nodes.map((n) => (n.children.length ? { [n.name]: shape(n.children) } : n.name))
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
  )
}

describe('buildCategoryTree (AC-F2, S07-3)', () => {
  it('an empty list gives an empty tree', () => {
    expect(buildCategoryTree([])).toEqual([])
  })

  it('nests TI > Cloud > AWS by parentId', () => {
    const tree = buildCategoryTree([cat('3', 'AWS', '2'), cat('1', 'TI'), cat('2', 'Cloud', '1')])
    expect(shape(tree)).toEqual([{ TI: [{ Cloud: ['AWS'] }] }])
    expect(tree[0].children[0].children[0].id).toBe('3')
  })

  it('sorts siblings by name, case-insensitive, at every level', () => {
    const tree = buildCategoryTree([
      cat('r', 'root'),
      cat('b', 'b', 'r'),
      cat('A', 'A', 'r'),
      cat('c', 'c', 'r'),
      cat('z', 'zeta'),
      cat('B', 'Beta'),
    ])
    expect(shape(tree)).toEqual(['Beta', { root: ['A', 'b', 'c'] }, 'zeta'])
  })

  it('ignores case when ordering (a before B, which a byte sort would reverse)', () => {
    const tree = buildCategoryTree([cat('2', 'B'), cat('1', 'a')])
    expect(shape(tree)).toEqual(['a', 'B'])
  })

  it('breaks name ties by id so the order stays deterministic', () => {
    const tree = buildCategoryTree([cat('2', 'cloud'), cat('1', 'Cloud')])
    expect(tree.map((n) => n.id)).toEqual(['1', '2'])
  })

  it('input order never changes the output (every permutation of 5 nodes)', () => {
    const flat = [cat('1', 'TI'), cat('2', 'Cloud', '1'), cat('3', 'AWS', '2'), cat('4', 'azure', '2'), cat('5', 'Math')]
    const expected = buildCategoryTree(flat)
    for (const perm of permutations(flat)) {
      expect(buildCategoryTree(perm)).toEqual(expected)
    }
    expect(shape(expected)).toEqual(['Math', { TI: [{ Cloud: ['AWS', 'azure'] }] }])
  })

  it('treats a node whose parent is missing as a root instead of dropping it', () => {
    const tree = buildCategoryTree([cat('1', 'TI'), cat('9', 'Orphan', 'gone')])
    expect(shape(tree)).toEqual(['Orphan', 'TI'])
  })

  it('does not mutate its input', () => {
    const flat = [cat('2', 'Cloud', '1'), cat('1', 'TI')]
    const copy = structuredClone(flat)
    buildCategoryTree(flat)
    expect(flat).toEqual(copy)
  })
})

describe('descendantsOf / subtreeHeight (AC-F13, S09a-3)', () => {
  const tree = buildCategoryTree([
    cat('ti', 'TI'),
    cat('cloud', 'Cloud', 'ti'),
    cat('aws', 'AWS', 'cloud'),
    cat('azure', 'Azure', 'cloud'),
    cat('math', 'Math'),
  ])

  it('returns the category itself plus every descendant', () => {
    expect([...descendantsOf(tree, 'cloud')].sort()).toEqual(['aws', 'azure', 'cloud'])
    expect([...descendantsOf(tree, 'ti')].sort()).toEqual(['aws', 'azure', 'cloud', 'ti'])
  })

  it('a leaf has only itself; an unknown id gives an empty set', () => {
    expect([...descendantsOf(tree, 'aws')]).toEqual(['aws'])
    expect(descendantsOf(tree, 'nope').size).toBe(0)
  })

  it('height counts levels: leaf 1, Cloud 2, TI 3; unknown 0', () => {
    expect(subtreeHeight(tree, 'aws')).toBe(1)
    expect(subtreeHeight(tree, 'cloud')).toBe(2)
    expect(subtreeHeight(tree, 'ti')).toBe(3)
    expect(subtreeHeight(tree, 'math')).toBe(1)
    expect(subtreeHeight(tree, 'nope')).toBe(0)
  })
})
