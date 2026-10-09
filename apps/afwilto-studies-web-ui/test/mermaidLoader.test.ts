import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({
  initialize: vi.fn(),
  parse: vi.fn(),
  render: vi.fn(),
}))
vi.mock('mermaid', () => ({ default: api }))

async function freshLoader() {
  vi.resetModules()
  return import('../src/features/markdown/mermaid')
}

describe('mermaid loader (FR-4, S08-4)', () => {
  beforeEach(() => {
    api.initialize.mockReset()
    api.parse.mockReset().mockResolvedValue(true)
    api.render.mockReset().mockResolvedValue({ svg: '<svg id="ok"></svg>' })
  })

  it('initializes once in strict mode, without auto start, dark theme', async () => {
    const { renderDiagram } = await freshLoader()
    await renderDiagram('m1', 'graph TD; A-->B')
    await renderDiagram('m2', 'graph TD; B-->C')
    expect(api.initialize).toHaveBeenCalledTimes(1)
    expect(api.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ startOnLoad: false, securityLevel: 'strict', theme: 'dark' })
    )
  })

  it('parses before rendering and returns the SVG', async () => {
    const { renderDiagram } = await freshLoader()
    await expect(renderDiagram('m1', 'graph TD; A-->B')).resolves.toBe('<svg id="ok"></svg>')
    expect(api.parse).toHaveBeenCalledWith('graph TD; A-->B')
    expect(api.render).toHaveBeenCalledWith('m1', 'graph TD; A-->B')
    expect(api.parse.mock.invocationCallOrder[0]).toBeLessThan(api.render.mock.invocationCallOrder[0])
  })

  it('a parse error rejects without rendering', async () => {
    api.parse.mockRejectedValue(new Error('Parse error on line 1'))
    const { renderDiagram } = await freshLoader()
    await expect(renderDiagram('m1', 'graph ???')).rejects.toThrow('Parse error on line 1')
    expect(api.render).not.toHaveBeenCalled()
  })

  it('a render error removes the temporary node Mermaid left behind and rethrows', async () => {
    api.render.mockImplementation(async (id: string) => {
      const leftover = document.createElement('div')
      leftover.id = `d${id}`
      document.body.appendChild(leftover)
      throw new Error('render failed')
    })
    const { renderDiagram } = await freshLoader()
    await expect(renderDiagram('m9', 'graph TD; A-->B')).rejects.toThrow('render failed')
    expect(document.getElementById('dm9')).toBeNull()
  })
})
