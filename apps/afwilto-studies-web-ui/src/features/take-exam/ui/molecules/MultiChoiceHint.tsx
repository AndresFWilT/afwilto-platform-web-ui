/** "Choose 2 options · 1 to go": under feedback each a multi answer is sent only once it is complete. */
export function MultiChoiceHint({ chooseCount, selectedCount }: { chooseCount: number; selectedCount: number }) {
  const remaining = Math.max(0, chooseCount - selectedCount)
  return (
    <p className="text-sm text-amber-300">
      {`Choose ${chooseCount} options · ${remaining} to go`}
    </p>
  )
}
