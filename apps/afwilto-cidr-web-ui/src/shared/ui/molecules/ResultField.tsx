import { MonoValue } from '@/shared/ui/atoms/MonoValue'

/** One labelled value of a result; renders a <dt>/<dd> pair inside a <dl>. */
export function ResultField({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="pt-0.5 text-sm text-neutral-400">{label}</dt>
      <dd>
        <MonoValue>{value}</MonoValue>
      </dd>
    </>
  )
}
