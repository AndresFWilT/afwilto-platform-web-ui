import { MonoValue } from '@/shared/ui/atoms/MonoValue'

/** CIDR blocks in the order the API returned them (ascending). */
export function BlockList({ blocks }: { blocks: string[] }) {
  return (
    <ol aria-label="CIDR blocks" className="flex flex-wrap gap-2">
      {blocks.map((block) => (
        <li key={block} className="px-2.5 py-1 rounded-md bg-brand-800 border border-surface-border">
          <MonoValue>{block}</MonoValue>
        </li>
      ))}
    </ol>
  )
}
