import { useId, useState } from 'react'
import { Button, Select } from '@afwilto/design-system'
import type { Classification, ExamCategory } from '@/exams/domain'
import { ConfirmDialog } from '@/shared/ui/organisms/ConfirmDialog'

interface Props {
  classification: Classification
  /** Resolves when the merge is done; the categories prop then changes. */
  onMerge: (from: ExamCategory, into: ExamCategory) => Promise<void>
}

/** Choose "from" and "into" within one classification, then confirm (FR-1). */
export function MergeCategories({ classification, onMerge }: Props) {
  const id = useId()
  const [fromId, setFromId] = useState('')
  const [intoId, setIntoId] = useState('')
  const [confirming, setConfirming] = useState(false)
  const find = (categoryId: string) => classification.categories.find((c) => c.id === categoryId)
  const from = find(fromId)
  const into = find(intoId)
  const ready = from !== undefined && into !== undefined && from !== into

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-40 grow basis-48 flex-col gap-1">
        <label htmlFor={`${id}-from`} className="text-xs text-neutral-400">Combinar desde ({classification.name})</label>
        <Select id={`${id}-from`} selectSize="sm" value={fromId} onChange={(e) => { setFromId(e.target.value); if (e.target.value === intoId) setIntoId('') }}>
          <option value="">Elige una categoría</option>
          {classification.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <div className="flex min-w-40 grow basis-48 flex-col gap-1">
        <label htmlFor={`${id}-into`} className="text-xs text-neutral-400">Combinar en ({classification.name})</label>
        <Select id={`${id}-into`} selectSize="sm" value={intoId} onChange={(e) => setIntoId(e.target.value)}>
          <option value="">Elige una categoría</option>
          {classification.categories.filter((c) => c.id !== fromId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <Button size="sm" variant="secondary" disabled={!ready} onClick={() => setConfirming(true)}>Combinar categorías de «{classification.name}»</Button>

      {confirming && ready && (
        <ConfirmDialog
          danger
          title={`¿Combinar «${from.name}» en «${into.name}»?`}
          confirmLabel="Combinar"
          onClose={() => setConfirming(false)}
          onConfirm={async () => {
            await onMerge(from, into)
            setConfirming(false)
            setFromId('')
            setIntoId('')
          }}
        >
          <p className="text-sm text-neutral-300">
            Las preguntas de «{from.name}» pasarán a «{into.name}» y «{from.name}» se eliminará. Esto no se puede deshacer desde la aplicación.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
