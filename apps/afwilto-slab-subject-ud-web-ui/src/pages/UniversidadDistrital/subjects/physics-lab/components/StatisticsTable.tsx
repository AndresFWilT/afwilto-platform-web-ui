import type { PointStatistics } from '@/application/ports/IPhysicsLabService'

interface StatisticsTableProps {
  points: PointStatistics[]
}

export function StatisticsTable({ points }: StatisticsTableProps) {
  const headers = ['Point', 'Mean (x̄)', 'Std Dev (σ)', 'Acc. Error', 'Abs. Error (EA)']

  return (
    <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
      <table className="w-full border-collapse text-sm" style={{ minWidth: '480px' }}>
        <thead>
          <tr className="border-b border-surface-border">
            {headers.map(h => (
              <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map(p => (
            <tr key={p.index} className="border-b border-surface-border/40">
              <td className="py-2 px-3 font-mono text-neutral-300">x{p.index + 1}</td>
              <td className="py-2 px-3 font-mono text-neutral-100 font-semibold">{p.mean}</td>
              <td className="py-2 px-3 font-mono text-amber-400">{p.standardDeviation}</td>
              <td className="py-2 px-3 font-mono text-primary-400">{p.accidentalError}</td>
              <td className="py-2 px-3 font-mono text-green-400 font-semibold">{p.absoluteError}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
