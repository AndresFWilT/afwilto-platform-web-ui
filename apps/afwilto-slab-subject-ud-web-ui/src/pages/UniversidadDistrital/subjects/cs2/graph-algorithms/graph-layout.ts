export interface VertexPosition {
  id: number
  x: number
  y: number
}

// Circular layout: evenly spaces n vertices on a circle.
// Starts at the top (−π/2) so vertex 0 is at the top.
export function computeCircularLayout(n: number, cx: number, cy: number, radius: number): VertexPosition[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { id: i, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
  })
}
