import { Text } from '@afwilto/design-system'
import type { WordFormed } from './types'

interface Props {
  words: WordFormed[]
  turnScore: number
  isFirstTurn: boolean
}

export function WordsFormedPanel({ words, turnScore, isFirstTurn }: Props) {
  if (words.length === 0) return null

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-success-500/30 bg-success-500/10">
      <div className="flex items-center justify-between">
        <Text variant="small" color="default" weight="semibold">Words formed</Text>
        <Text variant="small" color="default" weight="semibold" className="font-mono text-success-400">
          +{turnScore} pts
        </Text>
      </div>
      {words.map((w, i) => (
        <div key={i} className="flex items-center justify-between">
          <span className="font-mono text-sm text-neutral-200 tracking-wider">{w.word}</span>
          <span className="font-mono text-xs text-neutral-400">{w.score} pts</span>
        </div>
      ))}
      {turnScore >= 50 + words.reduce((s, w) => s + w.score, 0) - turnScore + words.reduce((s, w) => s + w.score, 0) && (
        <Text variant="caption" color="muted">🎉 Bingo! +50 bonus</Text>
      )}
      {isFirstTurn && (
        <Text variant="caption" color="muted">First word — center star doubles the score.</Text>
      )}
    </div>
  )
}
