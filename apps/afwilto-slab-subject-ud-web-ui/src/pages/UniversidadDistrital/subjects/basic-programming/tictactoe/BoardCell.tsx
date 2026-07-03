import type { TTTMark } from './types'

interface Props {
  mark: TTTMark | null
  onClick: () => void
  disabled: boolean
  ghostMark?: TTTMark | null
}

export function BoardCell({ mark, onClick, disabled, ghostMark }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center rounded-xl border-2 border-surface-border transition-all duration-150 group"
      style={{
        backgroundColor: 'var(--color-brand-50)',
        aspectRatio: '1',
      }}
    >
      {mark === 'X' && <XMark />}
      {mark === 'O' && <OMark />}
      {!mark && !disabled && ghostMark && (
        <div className="opacity-0 group-hover:opacity-25 transition-opacity duration-150">
          {ghostMark === 'X' ? <XMark /> : <OMark />}
        </div>
      )}
    </button>
  )
}

function XMark() {
  return (
    <svg viewBox="0 0 80 80" className="w-[65%] h-[65%]">
      <line x1="15" y1="15" x2="65" y2="65" stroke="var(--color-error-400)" strokeWidth="8" strokeLinecap="round" />
      <line x1="65" y1="15" x2="15" y2="65" stroke="var(--color-error-400)" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}

function OMark() {
  return (
    <svg viewBox="0 0 80 80" className="w-[65%] h-[65%]">
      <circle cx="40" cy="40" r="25" fill="none" stroke="var(--color-primary-400)" strokeWidth="8" />
    </svg>
  )
}
