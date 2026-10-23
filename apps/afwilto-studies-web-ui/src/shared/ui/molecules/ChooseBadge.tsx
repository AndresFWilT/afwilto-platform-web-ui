/** "Elige N" plus the live "k/N" counter of a multi-select question. */
export function ChooseBadge({ chooseCount, selectedCount }: { chooseCount: number; selectedCount: number }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <span className="rounded bg-primary-500/15 px-2 py-0.5 font-semibold text-primary-200">Elige {chooseCount}</span>
      <span aria-live="polite" className="font-mono text-neutral-300">
        {selectedCount}/{chooseCount}
      </span>
    </div>
  )
}
