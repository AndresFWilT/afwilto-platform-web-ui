/** "Elige 2 opciones · falta 1": under feedback each a multi answer is sent only once it is complete. */
export function MultiChoiceHint({ chooseCount, selectedCount }: { chooseCount: number; selectedCount: number }) {
  const remaining = Math.max(0, chooseCount - selectedCount)
  return (
    <p className="text-sm text-amber-300">
      {`Elige ${chooseCount} opciones · ${remaining === 1 ? 'falta 1' : `faltan ${remaining}`}`}
    </p>
  )
}
