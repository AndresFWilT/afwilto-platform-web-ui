import type { ScrabbleTile } from './types'
import { TileComponent } from './TileComponent'
import { Text } from '@afwilto/design-system'

interface Props {
  tiles: ScrabbleTile[]
  selectedIndices: Set<number>
  onSelect: (index: number) => void
  label: string
}

export function TileRack({ tiles, selectedIndices, onSelect, label }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" color="muted">{label}'s rack</Text>
      <div className="flex gap-1.5 flex-wrap">
        {tiles.map((tile, i) => (
          <TileComponent
            key={i}
            tile={tile}
            selected={selectedIndices.has(i)}
            onClick={() => onSelect(i)}
          />
        ))}
        {tiles.length === 0 && (
          <Text variant="caption" color="muted">Empty rack</Text>
        )}
      </div>
    </div>
  )
}
