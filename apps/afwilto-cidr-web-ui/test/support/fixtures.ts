import type { Aggregation, CidrRange, PrefixTable, RangeSummary } from '../../src/cidr/domain/types'

// Wire payloads copied from the backend acceptance criteria (spec 17 AC-B1,
// AC-B2, AC-B8, AC-B13), so UI tests display exactly what the API returns.

export const ipv4Range: CidrRange = {
  family: 'ipv4',
  input: '10.0.0.0/24',
  cidr: '10.0.0.0/24',
  prefixLength: 24,
  netmask: '255.255.255.0',
  wildcardBits: '0.0.0.255',
  firstIp: '10.0.0.0',
  firstIpDecimal: '167772160',
  lastIp: '10.0.0.255',
  lastIpDecimal: '167772415',
  totalHosts: '256',
  usableHosts: '254',
}

export const ipv6Range: CidrRange = {
  family: 'ipv6',
  input: '2001:4860:4860::8888/32',
  cidr: '2001:4860::/32',
  prefixLength: 32,
  netmask: null,
  wildcardBits: null,
  firstIp: '2001:4860:0000:0000:0000:0000:0000:0000',
  firstIpDecimal: '42541956101370907050197289607612071936',
  lastIp: '2001:4860:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF',
  lastIpDecimal: '42541956180599069564461627201156022271',
  totalHosts: '79228162514264337593543950336',
  usableHosts: null,
}

export const summary: RangeSummary = {
  family: 'ipv4',
  firstIp: '192.168.1.10',
  lastIp: '192.168.1.20',
  blocks: ['192.168.1.10/31', '192.168.1.12/30', '192.168.1.16/30', '192.168.1.20/32'],
  blockCount: 4,
}

export const aggregation: Aggregation = {
  inputCount: 6,
  uniqueCount: 5,
  blocks: ['10.0.0.0/30', '10.0.0.5/32'],
  blockCount: 2,
}

function table(family: 'ipv4' | 'ipv6', bits: number): PrefixTable {
  return {
    family,
    rows: Array.from({ length: bits + 1 }, (_, hostBits) => ({
      hostBits,
      prefixLength: bits - hostBits,
      netmask: family === 'ipv4' ? `mask-/${bits - hostBits}` : null,
      totalAddresses: (2n ** BigInt(hostBits)).toString(),
    })),
  }
}

export const ipv4Table = table('ipv4', 32)
export const ipv6Table = table('ipv6', 128)
