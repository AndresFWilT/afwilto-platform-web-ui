import { useId } from 'react'
import { Button, Input, Select } from '@afwilto/design-system'
import type { Classification, Difficulty } from '@/exams/domain'

export interface BankFilterValues {
  category: string
  origin: string
  difficulty: string
  q: string
  unclassified: boolean
}

interface Props {
  classifications: Classification[]
  originSets: string[]
  values: BankFilterValues
  onChange: (field: keyof BankFilterValues, value: string | boolean) => void
  onClear: () => void
  active: boolean
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' }

function Labeled({ label, children }: { label: string; children: (id: string) => React.ReactNode }) {
  const id = useId()
  return (
    <div className="flex min-w-40 grow basis-44 flex-col gap-1">
      <label htmlFor={id} className="text-xs text-neutral-400">{label}</label>
      {children(id)}
    </div>
  )
}

/** The bank filters. Which ones are on lives in the URL; this only draws and reports changes. */
export function BankFilters({ classifications, originSets, values, onChange, onClear, active }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {classifications.map((c) => (
        <Labeled key={c.id} label={`Categoría (${c.name})`}>
          {(id) => (
            <Select id={id} selectSize="sm" value={c.categories.some((k) => k.id === values.category) ? values.category : ''} onChange={(e) => onChange('category', e.target.value)}>
              <option value="">Todas</option>
              {c.categories.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </Select>
          )}
        </Labeled>
      ))}
      <Labeled label="Conjunto de origen">
        {(id) => (
          <Select id={id} selectSize="sm" value={values.origin} onChange={(e) => onChange('origin', e.target.value)}>
            <option value="">Todos</option>
            {originSets.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        )}
      </Labeled>
      <Labeled label="Dificultad">
        {(id) => (
          <Select id={id} selectSize="sm" value={values.difficulty} onChange={(e) => onChange('difficulty', e.target.value)}>
            <option value="">Todas</option>
            {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>)}
          </Select>
        )}
      </Labeled>
      <Labeled label="Buscar en el enunciado">
        {(id) => <Input id={id} inputSize="sm" value={values.q} onChange={(e) => onChange('q', e.target.value)} />}
      </Labeled>
      <label className="flex items-center gap-2 pb-2 text-sm text-neutral-200">
        <input type="checkbox" checked={values.unclassified} onChange={(e) => onChange('unclassified', e.target.checked)} />
        Sin clasificar
      </label>
      {active && <Button size="sm" variant="ghost" onClick={onClear}>Quitar filtros</Button>}
    </div>
  )
}
