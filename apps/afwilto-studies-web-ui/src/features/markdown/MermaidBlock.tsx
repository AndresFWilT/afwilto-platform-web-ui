import { useEffect, useId, useState } from 'react'
import { Skeleton } from '@afwilto/design-system'
import { renderDiagram } from './mermaid'

type DiagramState = { status: 'loading' } | { status: 'ok'; svg: string } | { status: 'error'; message: string }

/** A ```mermaid fence (FR-4): lazy Mermaid in strict mode, inline error box on failure. */
export function MermaidBlock({ source }: { source: string }) {
  const id = `mermaid-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`
  const [state, setState] = useState<DiagramState>({ status: 'loading' })

  useEffect(() => {
    let current = true
    setState({ status: 'loading' })
    renderDiagram(id, source).then(
      (svg) => current && setState({ status: 'ok', svg }),
      (e: unknown) => current && setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })
    )
    return () => {
      current = false
    }
  }, [id, source])

  if (state.status === 'loading') {
    return (
      <div className="my-4 flex flex-col gap-2" aria-busy="true">
        <span className="text-xs text-neutral-500">Rendering diagram…</span>
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
        <p className="font-medium text-red-400">Diagram error: {state.message}</p>
        <pre className="mt-2 overflow-x-auto font-mono text-xs text-neutral-300">{source}</pre>
      </div>
    )
  }
  // Mermaid's own output in strict mode: one of the two §9.3 exceptions.
  return <div className="my-4 flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: state.svg }} />
}
