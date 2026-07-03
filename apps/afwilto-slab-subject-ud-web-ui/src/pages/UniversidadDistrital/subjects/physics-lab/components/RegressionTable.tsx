import type { RegressionResult } from '@/application/ports/IPhysicsLabService'

interface RegressionTableProps {
  result: RegressionResult
}

export function RegressionTable({ result }: RegressionTableProps) {
  const { table, summations, regression } = result
  const headers = ['xi', 'yi', 'xi·yi', 'xi²', 'yi²', 'χ² term']

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full border-collapse text-sm" style={{ minWidth: '520px' }}>
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
            {table.map((row, i) => (
              <tr key={i} className="border-b border-surface-border/40">
                <td className="py-1.5 px-3 font-mono text-neutral-200">{row.xi}</td>
                <td className="py-1.5 px-3 font-mono text-neutral-200">{row.yi}</td>
                <td className="py-1.5 px-3 font-mono text-neutral-400">{row.xiYi}</td>
                <td className="py-1.5 px-3 font-mono text-neutral-400">{row.xiSquared}</td>
                <td className="py-1.5 px-3 font-mono text-neutral-400">{row.yiSquared}</td>
                <td className="py-1.5 px-3 font-mono text-amber-400">{row.chiSquaredTerm}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-surface-border font-bold">
              <td className="py-1.5 px-3 font-mono text-primary-400">{summations.sx}</td>
              <td className="py-1.5 px-3 font-mono text-primary-400">{summations.sy}</td>
              <td className="py-1.5 px-3 font-mono text-primary-400">{summations.sxy}</td>
              <td className="py-1.5 px-3 font-mono text-primary-400">{summations.sxx}</td>
              <td className="py-1.5 px-3 font-mono text-primary-400">{summations.syy}</td>
              <td className="py-1.5 px-3 font-mono text-amber-400">{regression.chiSquared}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Slope (m)',    value: regression.slope,                  color: '#60a5fa' },
          { label: 'Intercept (b)',value: regression.intercept,              color: '#60a5fa' },
          { label: 'r',            value: regression.correlationCoefficient, color: '#34d399' },
          { label: 'χ²',           value: regression.chiSquared,             color: '#fbbf24' },
          { label: 'σm',           value: regression.slopeDeviation,         color: '#f87171' },
          { label: 'σb',           value: regression.interceptDeviation,     color: '#f87171' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col gap-1 p-3 rounded-lg"
            style={{ backgroundColor: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
            <span className="text-xs text-neutral-500 uppercase tracking-wider">{label}</span>
            <span className="font-mono font-bold text-lg" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <span>Regression line:</span>
        <span className="font-mono text-neutral-200">
          y = {regression.slope}x + ({regression.intercept})
        </span>
        {result.linearizationExponent !== 1 && (
          <span className="text-neutral-500">
            where x = x<sup>{result.linearizationExponent}</sup>
          </span>
        )}
      </div>
    </div>
  )
}
