import type { HashMethod } from '@/application/ports/IHashFunctionService'

export const METHOD_LABELS: Record<HashMethod, string> = {
  DIVISION:       'Division',
  MID_SQUARE:     'Mid-Square',
  FOLDING:        'Folding (XOR)',
  TRANSFORMATION: 'Transformation',
}

export const ALL_METHODS: HashMethod[] = ['DIVISION', 'MID_SQUARE', 'FOLDING', 'TRANSFORMATION']
