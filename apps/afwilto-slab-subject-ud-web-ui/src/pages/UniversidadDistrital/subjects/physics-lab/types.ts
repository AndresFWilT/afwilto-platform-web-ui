import type { ErrorAnalysisResult, PropagatedValue, RegressionResult } from '@/application/ports/IPhysicsLabService'

export type WizardStep =
  | 'setup'
  | 'measurements'
  | 'conversion'
  | 'deviations'
  | 'propagation'
  | 'regression-input'
  | 'results'

export interface SetupConfig {
  n: number
  m: number
  scaleError: number
  significantFigures: number
}

export interface WizardState {
  step: WizardStep
  setup: SetupConfig | null
  measurements: number[][] | null
  workingMeasurements: number[][] | null
  analysisResult: ErrorAnalysisResult | null
  propagatedValues: PropagatedValue[] | null
  regressionDataPoints: { x: number; y: number }[]
  linearizationExponent: number
  regressionResult: RegressionResult | null
}

export const STEP_ORDER: WizardStep[] = [
  'setup',
  'measurements',
  'conversion',
  'deviations',
  'propagation',
  'regression-input',
  'results',
]

export const STEP_LABELS: Record<WizardStep, string> = {
  'setup':            'Setup',
  'measurements':     'Measurements',
  'conversion':       'Unit Conversion',
  'deviations':       'Deviations',
  'propagation':      'Error Propagation',
  'regression-input': 'Regression Input',
  'results':          'Results',
}

export const OPTIONAL_STEPS: WizardStep[] = ['conversion', 'propagation']
