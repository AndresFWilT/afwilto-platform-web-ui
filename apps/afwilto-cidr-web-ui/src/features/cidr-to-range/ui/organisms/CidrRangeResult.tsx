import type { CidrRange } from '@/cidr/domain/types'
import { groupDigits } from '@/shared/lib/groupDigits'
import { ResultPanel, type ResultEntry } from '@/shared/ui/organisms/ResultPanel'

/** Spec 17 FR-2 fields; the IPv4-only ones are left out when null. */
export function CidrRangeResult({ range }: { range: CidrRange }) {
  const entries: Array<ResultEntry | null> = [
    { label: 'CIDR range', value: range.cidr },
    range.netmask === null ? null : { label: 'Netmask', value: range.netmask },
    range.wildcardBits === null ? null : { label: 'Wildcard bits', value: range.wildcardBits },
    { label: 'First IP', value: range.firstIp },
    { label: 'First IP (decimal)', value: range.firstIpDecimal },
    { label: 'Last IP', value: range.lastIp },
    { label: 'Last IP (decimal)', value: range.lastIpDecimal },
    { label: 'Total hosts', value: groupDigits(range.totalHosts) },
    range.usableHosts === null ? null : { label: 'Usable hosts', value: groupDigits(range.usableHosts) },
  ]
  return <ResultPanel entries={entries.filter((entry) => entry !== null)} />
}
