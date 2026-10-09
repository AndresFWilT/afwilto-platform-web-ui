import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CodeBlock } from '../src/features/markdown/CodeBlock'
import { highlight } from '../src/features/markdown/highlighter'

vi.mock('../src/features/markdown/highlighter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/features/markdown/highlighter')>()),
  highlight: vi.fn(),
}))

const SOURCE = 'package main\n\nfunc main() {}'
let writeText: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.mocked(highlight).mockReset().mockImplementation(async (code, lang) => `<pre class="shiki" data-lang="${lang}"><code>${code}</code></pre>`)
  writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
})

describe('CodeBlock (AC-F5, S08-2)', () => {
  it('shows plain source first, then the highlighted HTML for go', async () => {
    const { container } = render(<CodeBlock code={SOURCE} lang="go" />)
    expect(container.textContent).toContain('func main() {}')
    await waitFor(() => expect(container.querySelector('.shiki[data-lang="go"]')).toBeTruthy())
    expect(highlight).toHaveBeenCalledWith(SOURCE, 'go')
  })

  it('copies the exact source, not the highlighted HTML, and confirms', async () => {
    const { container } = render(<CodeBlock code={SOURCE} lang="go" />)
    await waitFor(() => expect(container.querySelector('.shiki')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(screen.getByText('Copied')).toBeTruthy())
    expect(writeText).toHaveBeenCalledWith(SOURCE)
  })

  it('reports a failed copy without a native dialog', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    render(<CodeBlock code={SOURCE} lang="go" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await screen.findByText('Copy failed')).toBeTruthy()
  })

  it('reports a failed copy when the clipboard API is missing', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    render(<CodeBlock code={SOURCE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await screen.findByText('Copy failed')).toBeTruthy()
  })
})

describe('CodeBlock language handling (FR-4, S08-3)', () => {
  it.each([
    ['Shell', 'shellscript'],
    ['plaintext', 'text'],
  ])('%s asks the highlighter for %s', async (lang, shiki) => {
    render(<CodeBlock code="echo hi" lang={lang} />)
    await waitFor(() => expect(highlight).toHaveBeenCalledWith('echo hi', shiki))
  })

  it.each([['cobol'], [undefined]])('%s renders plain monospace and never loads the highlighter', async (lang) => {
    const { container } = render(<CodeBlock code="DISPLAY 'HI'." lang={lang} />)
    await new Promise((r) => setTimeout(r, 0))
    expect(highlight).not.toHaveBeenCalled()
    expect(container.querySelector('pre code')!.textContent).toBe("DISPLAY 'HI'.")
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy()
  })

  it('a highlighter failure keeps the plain source and shows no alert', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(highlight).mockRejectedValue(new Error('grammar failed'))
    const { container } = render(<CodeBlock code={SOURCE} lang="go" />)
    await waitFor(() => expect(warn).toHaveBeenCalled())
    expect(container.querySelector('pre code')!.textContent).toBe(SOURCE)
    expect(screen.queryByRole('alert')).toBeNull()
    warn.mockRestore()
  })
})
