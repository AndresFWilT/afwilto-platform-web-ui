export interface FrequencyEntry {
  symbol: string
  frequency: number
}

export interface HuffmanNode {
  frequency: number
  symbol: string | null
  left: HuffmanNode | null
  right: HuffmanNode | null
}

export interface HuffmanCodeEntry {
  symbol: string
  code: string
  frequency: number
  bitLength: number
}

export interface EncodingStats {
  encodedBitString: string
  originalBitCount: number
  compressedBitCount: number
  compressionRatio: number
  savingsPercent: number
}

export interface HuffmanEncodingResult {
  frequencyTable: FrequencyEntry[]
  tree: HuffmanNode
  codeTable: HuffmanCodeEntry[]
  encoding: EncodingStats
}

export interface IHuffmanService {
  encode(text: string): Promise<HuffmanEncodingResult>
}
