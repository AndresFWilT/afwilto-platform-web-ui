import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Card, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import { OR1_PROJECTS } from '../data'
import { ObjectiveFunctionInput } from './ObjectiveFunctionInput'
import { ConstraintListInput } from './ConstraintListInput'
import { FeasibleRegionChart } from './FeasibleRegionChart'
import { SolutionSummary } from './SolutionSummary'
import type { ConstraintRow } from './types'
import type { GraphicalSolution, OptimizationType } from '@/application/ports/IGraphicalMethodService'

const DEFAULT_CONSTRAINTS: ConstraintRow[] = [
  { a: '1.1', b: '1', sign: 'LE', rhs: '110' },
  { a: '100.5', b: '200', sign: 'LE', rhs: '10000' },
  { a: '10', b: '30', sign: 'LE', rhs: '1200' },
]

export function GraphicalMethodPage() {
  const { graphicalMethodService } = useServices()
  const project = OR1_PROJECTS.find(p => p.slug === 'graphical-method')!

  const [c1, setC1]         = useState('50')
  const [c2, setC2]         = useState('120')
  const [type, setType]     = useState<OptimizationType>('MAXIMIZE')
  const [intX, setIntX]     = useState(false)
  const [intY, setIntY]     = useState(false)
  const [constraints, setConstraints] = useState<ConstraintRow[]>(DEFAULT_CONSTRAINTS)
  const [solution, setSolution]       = useState<GraphicalSolution | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function handleObjectiveChange(field: 'c1' | 'c2' | 'type' | 'intX' | 'intY', value: string | boolean) {
    if (field === 'c1') setC1(value as string)
    else if (field === 'c2') setC2(value as string)
    else if (field === 'type') setType(value as OptimizationType)
    else if (field === 'intX') setIntX(value as boolean)
    else if (field === 'intY') setIntY(value as boolean)
  }

  function handleConstraintChange(i: number, field: keyof ConstraintRow, value: string) {
    setConstraints(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  async function handleSolve() {
    const c1n = parseFloat(c1)
    const c2n = parseFloat(c2)
    if (isNaN(c1n) || isNaN(c2n)) { setError('Objective coefficients must be numbers.'); return }

    const parsedConstraints = constraints.map((row, i) => {
      const a = parseFloat(row.a); const b = parseFloat(row.b); const rhs = parseFloat(row.rhs)
      if (isNaN(a) || isNaN(b) || isNaN(rhs)) throw new Error(`Constraint ${i + 1} has invalid numbers.`)
      return { coefficients: [a, b] as [number, number], sign: row.sign, rhs }
    })

    setLoading(true)
    setError(null)
    try {
      const result = await graphicalMethodService.solve({
        objective: { coefficients: [c1n, c2n], type },
        constraints: parsedConstraints,
        integerVariables: [intX, intY],
      })
      setSolution(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Solve failed')
    } finally {
      setLoading(false)
    }
  }

  const domainConstraints = constraints.map(row => ({
    coefficients: [parseFloat(row.a) || 0, parseFloat(row.b) || 0] as [number, number],
    sign: row.sign,
    rhs: parseFloat(row.rhs) || 0,
  }))

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
          <Text variant="h2" color="default">Graphical Method</Text>
          <Text variant="small" color="muted">2-variable LP — vertex enumeration with ALL pairwise intersections</Text>
        </div>

        {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <Card padding="md" className="flex flex-col gap-5">
            <Text variant="h4" color="default">Problem Definition</Text>

            <ObjectiveFunctionInput
              c1={c1} c2={c2} type={type} intX={intX} intY={intY}
              onChange={handleObjectiveChange}
            />

            <ConstraintListInput
              constraints={constraints}
              onChange={handleConstraintChange}
              onAdd={() => setConstraints(prev => [...prev, { a: '1', b: '1', sign: 'LE', rhs: '10' }])}
              onRemove={i => setConstraints(prev => prev.filter((_, idx) => idx !== i))}
            />

            <Button variant="primary" size="md" loading={loading} onClick={handleSolve} fullWidth>
              Solve
            </Button>
          </Card>

          {/* Results */}
          <div className="flex flex-col gap-4">
            {solution ? (
              <>
                <SolutionSummary solution={solution} />
                <FeasibleRegionChart solution={solution} constraints={domainConstraints} />
              </>
            ) : (
              <Card padding="md" className="flex flex-col items-center gap-3 py-12">
                <Text variant="body" color="muted" className="text-center">
                  Enter your LP and click <strong className="text-neutral-200">Solve</strong> to see the feasible region and optimal vertex.
                </Text>
                <Text variant="caption" color="muted" className="text-center">
                  Pre-loaded with textbook example: max 50x+120y s.t. 3 constraints
                </Text>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
