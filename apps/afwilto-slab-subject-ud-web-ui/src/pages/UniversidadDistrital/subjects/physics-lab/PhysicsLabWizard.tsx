import { useState, useCallback } from 'react'
import { StepIndicator } from './components/StepIndicator'
import { SetupStep } from './steps/SetupStep'
import { MeasurementEntryStep } from './steps/MeasurementEntryStep'
import { UnitConversionStep } from './steps/UnitConversionStep'
import { DeviationsStep } from './steps/DeviationsStep'
import { ErrorPropagationStep } from './steps/ErrorPropagationStep'
import { RegressionInputStep } from './steps/RegressionInputStep'
import { RegressionResultStep } from './steps/RegressionResultStep'
import type { WizardState, SetupConfig, WizardStep } from './types'
import type { ErrorAnalysisResult, PropagatedValue } from '@/application/ports/IPhysicsLabService'

const initial: WizardState = {
  step: 'setup',
  setup: null,
  measurements: null,
  workingMeasurements: null,
  analysisResult: null,
  propagatedValues: null,
  regressionDataPoints: [],
  linearizationExponent: 1,
  regressionResult: null,
}

export function PhysicsLabWizard() {
  const [state, setState] = useState<WizardState>(initial)
  const [completed, setCompleted] = useState<Set<WizardStep>>(new Set())
  const [skipped, setSkipped]     = useState<Set<WizardStep>>(new Set())

  const markComplete = (step: WizardStep) =>
    setCompleted(prev => new Set([...prev, step]))
  const markSkipped = (step: WizardStep) =>
    setSkipped(prev => new Set([...prev, step]))

  const go = (step: WizardStep) =>
    setState(s => ({ ...s, step }))

  // ── Step handlers ─────────────────────────────────────────────────────────

  const onSetup = useCallback((config: SetupConfig) => {
    setState(s => ({ ...s, setup: config, step: 'measurements' }))
    markComplete('setup')
  }, [])

  const onMeasurements = useCallback((m: number[][]) => {
    setState(s => ({ ...s, measurements: m, workingMeasurements: m, step: 'conversion' }))
    markComplete('measurements')
  }, [])

  const onConversionDone = useCallback((converted: number[][]) => {
    setState(s => ({ ...s, workingMeasurements: converted, step: 'deviations' }))
    markComplete('conversion')
  }, [])

  const onConversionSkip = useCallback(() => {
    setState(s => ({ ...s, step: 'deviations' }))
    markSkipped('conversion')
  }, [])

  const onDeviations = useCallback((result: ErrorAnalysisResult) => {
    const regressionDataPoints = result.points.map(p => ({ x: p.mean, y: 0 }))
    setState(s => ({ ...s, analysisResult: result, regressionDataPoints, step: 'propagation' }))
    markComplete('deviations')
  }, [])

  const onPropagation = useCallback((vals: PropagatedValue[]) => {
    setState(s => ({ ...s, propagatedValues: vals, step: 'regression-input' }))
    markComplete('propagation')
  }, [])

  const onPropagationSkip = useCallback(() => {
    setState(s => ({ ...s, step: 'regression-input' }))
    markSkipped('propagation')
  }, [])

  const onRegressionInput = useCallback(
    (pts: { x: number; y: number }[], exp: number) => {
      setState(s => ({ ...s, regressionDataPoints: pts, linearizationExponent: exp, step: 'results' }))
      markComplete('regression-input')
    },
    []
  )

  const onRestart = useCallback(() => {
    setState(initial)
    setCompleted(new Set())
    setSkipped(new Set())
  }, [])

  // ── Render current step ───────────────────────────────────────────────────

  const { step, setup, measurements, workingMeasurements, analysisResult } = state

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator currentStep={step} completedSteps={completed} skippedSteps={skipped} />

      {step === 'setup' && (
        <SetupStep onNext={onSetup} />
      )}

      {step === 'measurements' && setup && (
        <MeasurementEntryStep
          setup={setup}
          initial={measurements}
          onBack={() => go('setup')}
          onNext={onMeasurements}
        />
      )}

      {step === 'conversion' && workingMeasurements && (
        <UnitConversionStep
          measurements={workingMeasurements}
          onBack={() => go('measurements')}
          onSkip={onConversionSkip}
          onNext={onConversionDone}
        />
      )}

      {step === 'deviations' && setup && workingMeasurements && (
        <DeviationsStep
          setup={setup}
          measurements={workingMeasurements}
          onBack={() => go('conversion')}
          onNext={onDeviations}
        />
      )}

      {step === 'propagation' && analysisResult && (
        <ErrorPropagationStep
          analysisPoints={analysisResult.points}
          onBack={() => go('deviations')}
          onSkip={onPropagationSkip}
          onNext={onPropagation}
        />
      )}

      {step === 'regression-input' && analysisResult && (
        <RegressionInputStep
          analysisPoints={analysisResult.points}
          initialDataPoints={state.regressionDataPoints}
          initialExponent={state.linearizationExponent}
          onBack={() => go('propagation')}
          onNext={onRegressionInput}
        />
      )}

      {step === 'results' && (
        <RegressionResultStep
          dataPoints={state.regressionDataPoints}
          linearizationExponent={state.linearizationExponent}
          significantFigures={setup?.significantFigures ?? 4}
          onBack={() => go('regression-input')}
          onRestart={onRestart}
        />
      )}
    </div>
  )
}
