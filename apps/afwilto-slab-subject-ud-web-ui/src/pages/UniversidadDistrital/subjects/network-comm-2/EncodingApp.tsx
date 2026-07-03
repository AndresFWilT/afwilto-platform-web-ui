import { useState } from 'react'
import { HuffmanView } from './huffman/HuffmanView'
import { ShannonFanoView } from './shannon-fano/ShannonFanoView'

type Tab = 'huffman' | 'shannon-fano'

const TABS: { id: Tab; label: string }[] = [
  { id: 'huffman',      label: 'Huffman' },
  { id: 'shannon-fano', label: 'Shannon-Fano' },
]

export function EncodingApp() {
  const [activeTab, setActiveTab] = useState<Tab>('huffman')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-surface-overlay)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-150"
            style={
              activeTab === tab.id
                ? { backgroundColor: 'var(--color-primary-600)', color: 'white' }
                : { color: 'var(--color-neutral-400)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'huffman'      && <HuffmanView />}
      {activeTab === 'shannon-fano' && <ShannonFanoView />}
    </div>
  )
}
