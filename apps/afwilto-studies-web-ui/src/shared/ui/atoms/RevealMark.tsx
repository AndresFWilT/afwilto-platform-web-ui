/** `correct`: the right option; `wrong`: the taker picked it and it is wrong; `right`: the taker picked it and it is right. */
export type RevealMarkKind = 'correct' | 'wrong' | 'right'

const MARKS: Record<RevealMarkKind, { icon: string; text: string; tone: string }> = {
  correct: { icon: '✓', text: 'Correct', tone: 'text-green-400' },
  right: { icon: '✓', text: 'Your answer', tone: 'text-green-400' },
  wrong: { icon: '✗', text: 'Your answer', tone: 'text-red-400' },
}

/** Icon + colour + text, never colour alone (FR-11). */
export function RevealMark({ kind }: { kind: RevealMarkKind }) {
  const { icon, text, tone } = MARKS[kind]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${tone}`}>
      <span aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </span>
  )
}
