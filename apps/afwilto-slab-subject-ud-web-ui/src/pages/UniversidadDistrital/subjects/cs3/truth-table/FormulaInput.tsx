import { useState } from 'react'
import { Card, Text, Button } from '@afwilto/design-system'

interface TokenDef {
  display: string
  api: string
  category: 'var' | 'op' | 'paren' | 'control'
}

const TOKENS: TokenDef[] = [
  { display: 'p', api: 'p',   category: 'var'   },
  { display: 'q', api: 'q',   category: 'var'   },
  { display: 'r', api: 'r',   category: 'var'   },
  { display: '∧', api: '^',   category: 'op'    },
  { display: '∨', api: 'v',   category: 'op'    },
  { display: '¬', api: '-',   category: 'op'    },
  { display: '→', api: '=>',  category: 'op'    },
  { display: '↔', api: '<=>',  category: 'op'    },
  { display: '(', api: '(',   category: 'paren' },
  { display: ')', api: ')',   category: 'paren' },
]

const CATEGORY_STYLE: Record<TokenDef['category'], string> = {
  var:     'bg-primary-600/20 text-primary-300 border-primary-500/30 hover:bg-primary-600/40',
  op:      'bg-violet-600/20 text-violet-300 border-violet-500/30 hover:bg-violet-600/40',
  paren:   'bg-surface-overlay text-neutral-300 border-surface-border hover:bg-surface-border',
  control: 'bg-surface-overlay text-neutral-300 border-surface-border hover:bg-surface-border',
}

interface FormulaInputProps {
  disabled: boolean
  onGenerate: (formula: string) => void
}

export function FormulaInput({ disabled, onGenerate }: FormulaInputProps) {
  const [parts, setParts] = useState<{ display: string; api: string }[]>([])

  const display = parts.map(p => p.display).join('')
  const api     = parts.map(p => p.api).join('')

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div>
        <Text variant="h4" color="default">Formula Builder</Text>
        <Text variant="caption" color="muted">
          Click symbols to build the formula. Operator precedence: ¬ {'>'} ∧ {'>'} ∨ {'>'} → {'>'} ↔
        </Text>
      </div>

      {/* Display box */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg min-h-[44px]"
        style={{ backgroundColor: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
        <span className="font-mono text-lg text-neutral-100 flex-1 tracking-wide">
          {display || <span className="text-neutral-600 italic text-sm">Click buttons to build formula…</span>}
        </span>
        {parts.length > 0 && (
          <span className="text-xs text-neutral-500 font-mono shrink-0">({api})</span>
        )}
      </div>

      {/* Token buttons */}
      <div className="flex flex-wrap gap-2">
        {TOKENS.map(tok => (
          <button
            key={tok.api}
            disabled={disabled}
            onClick={() => setParts(prev => [...prev, { display: tok.display, api: tok.api }])}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold border transition-colors ${CATEGORY_STYLE[tok.category]}`}
          >
            {tok.display}
          </button>
        ))}
        <button
          disabled={disabled || parts.length === 0}
          onClick={() => setParts(prev => prev.slice(0, -1))}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-colors ${CATEGORY_STYLE.control}`}
        >
          Del ←
        </button>
        <button
          disabled={disabled || parts.length === 0}
          onClick={() => setParts([])}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-colors bg-red-900/20 text-red-400 border-red-500/30 hover:bg-red-900/40`}
        >
          AC
        </button>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" disabled={disabled || api.length === 0}
          onClick={() => api && onGenerate(api)}>
          Generate Table →
        </Button>
      </div>
    </Card>
  )
}
