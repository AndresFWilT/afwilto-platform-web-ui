import { STEP_ORDER, STEP_LABELS, OPTIONAL_STEPS, type WizardStep } from '../types'

interface StepIndicatorProps {
  currentStep: WizardStep
  completedSteps: Set<WizardStep>
  skippedSteps: Set<WizardStep>
}

export function StepIndicator({ currentStep, completedSteps, skippedSteps }: StepIndicatorProps) {
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {STEP_ORDER.map((step, idx) => {
        const isActive    = step === currentStep
        const isCompleted = completedSteps.has(step)
        const isSkipped   = skippedSteps.has(step)
        const isOptional  = OPTIONAL_STEPS.includes(step)

        let bg = 'var(--color-surface-overlay)'
        let border = 'var(--color-surface-border)'
        let textColor = 'var(--color-neutral-500)'

        if (isActive) {
          bg = 'var(--color-primary-600)'
          border = 'var(--color-primary-400)'
          textColor = 'white'
        } else if (isCompleted) {
          bg = 'rgba(52,211,153,0.12)'
          border = 'rgba(52,211,153,0.4)'
          textColor = 'var(--color-success-400)'
        } else if (isSkipped) {
          bg = 'rgba(148,163,184,0.08)'
          border = 'rgba(148,163,184,0.2)'
          textColor = 'var(--color-neutral-600)'
        }

        return (
          <div
            key={step}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            style={{ backgroundColor: bg, border: `1px solid ${border}`, color: textColor }}
          >
            <span className="font-mono font-bold">{idx + 1}</span>
            <span>{STEP_LABELS[step]}</span>
            {isOptional && !isCompleted && !isSkipped && !isActive && (
              <span className="opacity-50 text-[10px]">(opt)</span>
            )}
            {isCompleted && <span>✓</span>}
            {isSkipped && <span className="opacity-50">↷</span>}
          </div>
        )
      })}
    </div>
  )
}
