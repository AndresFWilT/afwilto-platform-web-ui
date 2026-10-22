// Spec 17 §6 — the calculator's results, mirroring the API schemas without
// the envelope. Values that can exceed 2^53 are decimal strings: the UI shows
// them, it never does arithmetic on them (every calculation is backend-side).

export type IpFamily = 'ipv4' | 'ipv6'

export interface CidrRange {
  family: IpFamily
  input: string
  cidr: string
  prefixLength: number
  /** IPv4 only. */
  netmask: string | null
  /** IPv4 only. */
  wildcardBits: string | null
  firstIp: string
  firstIpDecimal: string
  lastIp: string
  lastIpDecimal: string
  totalHosts: string
  /** IPv4 only. */
  usableHosts: string | null
}

export interface RangeSummary {
  family: IpFamily
  firstIp: string
  lastIp: string
  blocks: string[]
  blockCount: number
}

export interface Aggregation {
  inputCount: number
  uniqueCount: number
  blocks: string[]
  blockCount: number
}

export interface PrefixRow {
  hostBits: number
  prefixLength: number
  /** IPv4 only. */
  netmask: string | null
  totalAddresses: string
}

export interface PrefixTable {
  family: IpFamily
  rows: PrefixRow[]
}
