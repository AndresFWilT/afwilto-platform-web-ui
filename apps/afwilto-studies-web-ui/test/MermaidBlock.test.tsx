import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MermaidBlock } from '../src/features/markdown/MermaidBlock'
import { renderDiagram } from '../src/features/markdown/mermaid'

vi.mock('../src/features/markdown/mermaid', () => ({ renderDiagram: vi.fn() }))

beforeEach(() => {
  vi.mocked(renderDiagram).mockReset()
})

describe('MermaidBlock (AC-F5, S08-4)', () => {
  it('shows a placeholder while the diagram renders', () => {
    vi.mocked(renderDiagram).mockReturnValue(new Promise(() => {}))
    render(<MermaidBlock source="graph TD; A-->B" />)
    expect(screen.getByText('Rendering diagram…')).toBeTruthy()
  })

  it('injects the SVG Mermaid returned, using a CSS-safe id', async () => {
    vi.mocked(renderDiagram).mockResolvedValue('<svg data-testid="diagram"><g></g></svg>')
    render(<MermaidBlock source="graph TD; A-->B" />)
    expect(await screen.findByTestId('diagram')).toBeTruthy()
    const [id, source] = vi.mocked(renderDiagram).mock.calls[0]
    expect(id).toMatch(/^mermaid-[A-Za-z0-9_-]+$/)
    expect(source).toBe('graph TD; A-->B')
  })

  it('shows the error message and the original source on failure', async () => {
    vi.mocked(renderDiagram).mockRejectedValue(new Error('Parse error on line 2'))
    const { container } = render(<MermaidBlock source={'graph TD\n  A-->'} />)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Parse error on line 2')
    expect(alert.querySelector('pre')!.textContent).toBe('graph TD\n  A-->')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('two diagrams get distinct ids', async () => {
    vi.mocked(renderDiagram).mockResolvedValue('<svg></svg>')
    render(
      <>
        <MermaidBlock source="graph TD; A-->B" />
        <MermaidBlock source="graph TD; C-->D" />
      </>
    )
    await vi.waitFor(() => expect(renderDiagram).toHaveBeenCalledTimes(2))
    const ids = vi.mocked(renderDiagram).mock.calls.map((c) => c[0])
    expect(new Set(ids).size).toBe(2)
  })
})
