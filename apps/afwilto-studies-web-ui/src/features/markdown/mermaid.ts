// The only module that loads Mermaid, and only through import() (AC-F14).

type Mermaid = (typeof import('mermaid'))['default']

export const MERMAID_CONFIG = { startOnLoad: false, securityLevel: 'strict', theme: 'dark' } as const

let ready: Promise<Mermaid> | null = null

function loadMermaid(): Promise<Mermaid> {
  ready ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize(MERMAID_CONFIG)
    return mermaid
  })
  ready.catch(() => {
    ready = null
  })
  return ready
}

/** Renders `source` to an SVG string; rejects with Mermaid's message on invalid input. */
export async function renderDiagram(id: string, source: string): Promise<string> {
  const mermaid = await loadMermaid()
  await mermaid.parse(source)
  try {
    const { svg } = await mermaid.render(id, source)
    return svg
  } catch (e) {
    // On failure Mermaid can leave its temporary container in <body>.
    document.getElementById(`d${id}`)?.remove()
    throw e
  }
}
