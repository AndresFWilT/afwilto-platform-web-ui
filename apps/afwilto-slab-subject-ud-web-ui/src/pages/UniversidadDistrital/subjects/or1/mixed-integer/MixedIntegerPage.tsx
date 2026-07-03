import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Card, Alert, FormField } from '@afwilto/design-system'
import { useServices } from '@/di'
import { OR1_PROJECTS } from '../data'
import { VariableDefinition } from './VariableDefinition'
import { MIPConstraintInput } from './MIPConstraintInput'
import { SolutionDisplay } from './SolutionDisplay'
import type { VariableRow, ConstraintRow, MIPResult } from './types'
import type { MIPOptimizationType } from '@/application/ports/IMixedIntegerService'

const DEFAULT_VARS: VariableRow[] = [
  { name: 'x1', type: 'CONTINUOUS' },
  { name: 'x2', type: 'INTEGER' },
]
const DEFAULT_CONSTRAINTS: ConstraintRow[] = [
  { coefficients: ['1.1', '1'], sign: 'LE', rhs: '110' },
  { coefficients: ['100.5', '200'], sign: 'LE', rhs: '10000' },
]

export function MixedIntegerPage() {
  const { mixedIntegerService } = useServices()
  const project = OR1_PROJECTS.find(p => p.slug === 'mixed-integer')!

  const [variables, setVariables]     = useState<VariableRow[]>(DEFAULT_VARS)
  const [objCoeffs, setObjCoeffs]     = useState<string[]>(['50', '120'])
  const [objType, setObjType]         = useState<MIPOptimizationType>('MAXIMIZE')
  const [constraints, setConstraints] = useState<ConstraintRow[]>(DEFAULT_CONSTRAINTS)
  const [result, setResult]           = useState<MIPResult | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function syncCoeffCount(newVarCount: number) {
    setObjCoeffs(prev => {
      const arr = [...prev]
      while (arr.length < newVarCount) arr.push('0')
      return arr.slice(0, newVarCount)
    })
    setConstraints(prev => prev.map(row => {
      const coeffs = [...row.coefficients]
      while (coeffs.length < newVarCount) coeffs.push('0')
      return { ...row, coefficients: coeffs.slice(0, newVarCount) }
    }))
  }

  function handleAddVar() {
    const newVar: VariableRow = { name: `x${variables.length + 1}`, type: 'CONTINUOUS' }
    setVariables(prev => [...prev, newVar])
    syncCoeffCount(variables.length + 1)
  }

  function handleRemoveVar(i: number) {
    if (variables.length <= 1) return
    setVariables(prev => prev.filter((_, idx) => idx !== i))
    setObjCoeffs(prev => prev.filter((_, idx) => idx !== i))
    setConstraints(prev => prev.map(row => ({
      ...row, coefficients: row.coefficients.filter((_, idx) => idx !== i),
    })))
  }

  function handleVarChange(i: number, field: keyof VariableRow, value: string) {
    setVariables(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v))
  }

  function handleConstraintChange(i: number, field: 'sign' | 'rhs' | `coeff-${number}`, value: string) {
    setConstraints(prev => prev.map((row, idx) => {
      if (idx !== i) return row
      if (field === 'sign') return { ...row, sign: value as ConstraintRow['sign'] }
      if (field === 'rhs') return { ...row, rhs: value }
      const j = parseInt(field.replace('coeff-', ''))
      const coeffs = [...row.coefficients]
      coeffs[j] = value
      return { ...row, coefficients: coeffs }
    }))
  }

  async function handleSolve() {
    const parsedObjCoeffs = objCoeffs.map(s => parseFloat(s))
    if (parsedObjCoeffs.some(isNaN)) { setError('Objective coefficients must be numbers.'); return }

    const parsedConstraints = constraints.map((row, i) => {
      const coeffs = row.coefficients.map(s => parseFloat(s))
      if (coeffs.some(isNaN)) throw new Error(`Constraint ${i + 1} has invalid coefficients.`)
      const rhs = parseFloat(row.rhs)
      if (isNaN(rhs)) throw new Error(`Constraint ${i + 1} RHS is not a number.`)
      return { coefficients: coeffs, sign: row.sign, rhs }
    })

    setLoading(true); setError(null)
    try {
      const res = await mixedIntegerService.solve({
        variables: variables.map(v => ({ name: v.name, type: v.type })),
        objective: { coefficients: parsedObjCoeffs, type: objType },
        constraints: parsedConstraints,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Solve failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaseLayout>
      <div className="flex flex-col gap-6 w-full">
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud" className="text-neutral-500 hover:text-neutral-300 transition-colors">UD</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud/operations-research-1" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Operations Research I
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300">{project.title}</span>
        </nav>

        <div className="flex flex-col gap-1">
          <Text variant="h2" color="default">Mixed Integer Programming</Text>
          <Text variant="small" color="muted">N-variable MIP — Simplex LP relaxation + Branch & Bound</Text>
        </div>

        {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="md" className="flex flex-col gap-5">
            <Text variant="h4" color="default">Problem Definition</Text>

            <VariableDefinition
              variables={variables}
              onChange={handleVarChange}
              onAdd={handleAddVar}
              onRemove={handleRemoveVar}
            />

            {/* Objective row */}
            <div className="flex flex-col gap-2">
              <Text variant="small" weight="medium" color="muted">Objective function</Text>
              <div className="flex flex-wrap items-end gap-2">
                {variables.map((v, j) => (
                  <div key={j} className="flex items-end gap-1">
                    <FormField
                      label={j === 0 ? v.name : v.name}
                      id={`mip-obj-${j}`}
                      type="number"
                      value={objCoeffs[j] ?? '0'}
                      inputSize="sm"
                      onChange={e => setObjCoeffs(prev => { const arr = [...prev]; arr[j] = e.target.value; return arr })}
                      className="w-20"
                    />
                    {j < variables.length - 1 && <span className="text-neutral-500 text-sm pb-2">+</span>}
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-400">Type</span>
                  <select
                    value={objType}
                    onChange={e => setObjType(e.target.value as MIPOptimizationType)}
                    className="bg-surface-raised border border-surface-border text-neutral-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-primary-400"
                  >
                    <option value="MAXIMIZE">Maximize</option>
                    <option value="MINIMIZE">Minimize</option>
                  </select>
                </div>
              </div>
            </div>

            <MIPConstraintInput
              variables={variables}
              constraints={constraints}
              onChange={handleConstraintChange}
              onAdd={() => setConstraints(prev => [
                ...prev,
                { coefficients: variables.map(() => '1'), sign: 'LE', rhs: '10' },
              ])}
              onRemove={i => setConstraints(prev => prev.filter((_, idx) => idx !== i))}
            />

            <Button variant="primary" size="md" loading={loading} onClick={handleSolve} fullWidth>
              Solve MIP
            </Button>
          </Card>

          <div className="flex flex-col gap-4">
            {result ? (
              <SolutionDisplay result={result} />
            ) : (
              <Card padding="md" className="flex flex-col items-center gap-3 py-12">
                <Text variant="body" color="muted" className="text-center">
                  Define your MIP and click <strong className="text-neutral-200">Solve MIP</strong>.
                </Text>
                <Text variant="caption" color="muted" className="text-center">
                  Pre-loaded: max 50x₁+120x₂ (x₂ integer) s.t. 2 constraints
                </Text>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
