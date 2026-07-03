export interface FrequencyEntry {
  symbol: string
  frequency: number
}

export interface CodeEntry {
  symbol: string
  code: string
  bitLength: number
}

export interface EncodingStats {
  encodedBitString: string
  originalBitCount: number
  compressedBitCount: number
  compressionRatio: number
  savingsPercent: number
}

export interface HuffmanNode {
  frequency: number
  symbol: string | null
  left: HuffmanNode | null
  right: HuffmanNode | null
}

export interface HuffmanEncodingResult {
  frequencyTable: FrequencyEntry[]
  tree: HuffmanNode
  codeTable: CodeEntry[]
  encoding: EncodingStats
}

export interface ShannonFanoEntry {
  symbol: string
  frequency: number
  probability: number
  entropy: number
  messageEntropy: number
  codeBitLength: number
  messageBits: number
  code: string
}

export interface ShannonFanoTotals {
  frequency: number
  probability: number
  entropy: number
  messageEntropy: number
  codeBits: number
  messageBits: number
}

export interface ShannonFanoEncodingResult {
  entries: ShannonFanoEntry[]
  totals: ShannonFanoTotals
  codeTable: CodeEntry[]
  encoding: EncodingStats
}

export interface IEncodingService {
  encodeHuffman(text: string): Promise<HuffmanEncodingResult>
  encodeShannonFano(text: string): Promise<ShannonFanoEncodingResult>
}
