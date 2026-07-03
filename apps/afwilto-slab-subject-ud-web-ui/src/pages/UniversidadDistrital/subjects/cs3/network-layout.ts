import type { ScheduledActivity } from '@/application/ports/ICriticalPathService'

export interface NodeLayout {
  name: string
  x: number
  y: number
  depth: number
}

export interface NetworkLayout {
  nodes: Map<string, NodeLayout>
  width: number
  height: number
}

export const NODE_W = 100
export const NODE_H = 72
export const H_GAP  = 80
export const V_GAP  = 40

/**
 * Computes node positions using topological depth on the x-axis
 * and position-within-depth on the y-axis.
 * Replaces Grafico.hallarNivel() from the legacy.
 */
export function computeLayout(schedule: ScheduledActivity[]): NetworkLayout {
  // Build successor map for BFS depth propagation
  const successors = new Map<string, string[]>()
  for (const a of schedule) {
    for (const pred of a.predecessors) {
      if (!successors.has(pred)) successors.set(pred, [])
      successors.get(pred)!.push(a.name)
    }
  }

  // BFS from roots: depth = max depth through all predecessor paths
  const depth = new Map<string, number>()
  const queue: string[] = []
  for (const a of schedule) {
    if (a.predecessors.length === 0) {
      depth.set(a.name, 0)
      queue.push(a.name)
    }
  }
  while (queue.length > 0) {
    const name = queue.shift()!
    const d = depth.get(name)!
    for (const succ of (successors.get(name) ?? [])) {
      const cur = depth.get(succ) ?? -1
      if (d + 1 > cur) {
        depth.set(succ, d + 1)
        queue.push(succ)
      }
    }
  }

  // Group by depth, sort by activity name for determinism
  const byDepth = new Map<number, string[]>()
  for (const a of schedule) {
    const d = depth.get(a.name) ?? 0
    if (!byDepth.has(d)) byDepth.set(d, [])
    byDepth.get(d)!.push(a.name)
  }
  for (const names of byDepth.values()) names.sort()

  const maxDepth = Math.max(...byDepth.keys(), 0)
  const maxPerLevel = Math.max(...[...byDepth.values()].map(v => v.length), 1)

  const nodes = new Map<string, NodeLayout>()
  for (const [d, names] of byDepth) {
    const colX = H_GAP + d * (NODE_W + H_GAP)
    const totalH = names.length * (NODE_H + V_GAP) - V_GAP
    const startY = V_GAP + (maxPerLevel * (NODE_H + V_GAP) - totalH) / 2
    names.forEach((name, idx) => {
      nodes.set(name, { name, x: colX, y: startY + idx * (NODE_H + V_GAP), depth: d })
    })
  }

  return {
    nodes,
    width:  H_GAP + (maxDepth + 1) * (NODE_W + H_GAP),
    height: V_GAP + maxPerLevel * (NODE_H + V_GAP),
  }
}
