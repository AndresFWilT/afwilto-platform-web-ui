export type WizardStep = 'file' | 'report' | 'confirm'

const STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 'file', label: '1. File' },
  { id: 'report', label: '2. Report' },
  { id: 'confirm', label: '3. Confirm' },
]

/** The three steps of the wizard; the current one is marked in text and with aria-current. */
export function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <ol aria-label="Steps" className="flex flex-wrap gap-2 text-sm">
      {STEPS.map((step) => (
        <li
          key={step.id}
          aria-current={step.id === current ? 'step' : undefined}
          className={step.id === current ? 'rounded-md bg-primary-500/20 px-3 py-1 font-semibold text-primary-200' : 'rounded-md px-3 py-1 text-neutral-400'}
        >
          {step.label}
        </li>
      ))}
    </ol>
  )
}
