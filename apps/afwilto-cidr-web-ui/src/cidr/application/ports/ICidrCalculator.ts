import type { Aggregation, CidrRange, IpFamily, PrefixTable, RangeSummary } from '@/cidr/domain/types'

/**
 * The CIDR calculator port (spec 17 FR-2..FR-5). Implementations reject with
 * `CidrValidationError` when the input breaks a rule, and with a plain `Error`
 * carrying a human-readable message for anything else.
 */
export interface ICidrCalculator {
  calculateRange(cidr: string): Promise<CidrRange>
  summarizeRange(firstIp: string, lastIp: string): Promise<RangeSummary>
  aggregate(addresses: string[]): Promise<Aggregation>
  prefixTable(family: IpFamily): Promise<PrefixTable>
}
