import type { PrefixTable } from '@/cidr/domain/types'
import { groupDigits } from '@/shared/lib/groupDigits'

// A plain table that scrolls sideways on narrow screens: no breakpoint
// utilities, so the shell's Tailwind build cannot override its layout.
export function PrefixTableView({ table }: { table: PrefixTable }) {
  const withMask = table.family === 'ipv4'
  const cell = 'px-4 py-2 font-mono text-sm text-neutral-100 whitespace-nowrap'
  const head = 'px-4 py-3 text-left text-sm font-medium text-neutral-400 whitespace-nowrap'

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table aria-label={`${withMask ? 'IPv4' : 'IPv6'} CIDR table`} className="w-full border-collapse">
        <thead>
          <tr className="border-b border-surface-border">
            <th scope="col" className={head}>Host bits</th>
            <th scope="col" className={head}>CIDR</th>
            {withMask && <th scope="col" className={head}>Subnet mask</th>}
            <th scope="col" className={head}>IP addresses</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.prefixLength} className="border-b border-surface-border/60">
              <td className={cell}>{row.hostBits}</td>
              <td className={cell}>/{row.prefixLength}</td>
              {withMask && <td className={cell}>{row.netmask}</td>}
              <td className={cell}>{groupDigits(row.totalAddresses)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
