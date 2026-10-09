import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { MarkdownView } from '../src/features/markdown/MarkdownView'
import { renderDiagram } from '../src/features/markdown/mermaid'

vi.mock('../src/features/markdown/highlighter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/features/markdown/highlighter')>()),
  highlight: vi.fn(async (code: string, lang: string) => `<pre class="shiki" data-lang="${lang}"><code>${code}</code></pre>`),
}))
vi.mock('../src/features/markdown/mermaid', () => ({ renderDiagram: vi.fn() }))

function Probe() {
  const { pathname } = useLocation()
  return <output data-testid="location">{pathname}</output>
}

function renderMd(content: string) {
  return render(
    <MemoryRouter initialEntries={['/studies/notes/n1']}>
      <Probe />
      <MarkdownView content={content} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.mocked(renderDiagram).mockReset().mockResolvedValue('<svg data-testid="diagram"></svg>')
})

describe('MarkdownView — math (AC-F5, S08-1)', () => {
  it('renders display math with KaTeX', () => {
    const { container } = renderMd('$$E=mc^2$$')
    expect(container.querySelector('.katex-display .katex')).toBeTruthy()
  })

  it('renders $$ fences on their own lines as display math', () => {
    const { container } = renderMd('$$\nx^2\n$$')
    expect(container.querySelector('.katex-display .katex')).toBeTruthy()
  })

  it('keeps $$…$$ inline when it shares the paragraph with text', () => {
    const { container } = renderMd('Energy $$E=mc^2$$ is famous.')
    expect(container.querySelector('.katex')).toBeTruthy()
    expect(container.querySelector('.katex-display')).toBeNull()
  })

  it('renders a lone $$…$$ inside a list item or quote as display math', () => {
    const { container } = renderMd('> $$a+b$$\n\n- $$c+d$$')
    expect(container.querySelectorAll('.katex-display')).toHaveLength(2)
  })

  it('renders inline math outside a display block', () => {
    const { container } = renderMd('Area is $a^2$ here.')
    const katex = container.querySelector('.katex')!
    expect(katex).toBeTruthy()
    expect(katex.closest('.katex-display')).toBeNull()
  })

  it('renders an invalid formula as source in the error color; the rest still renders', () => {
    const { container } = renderMd('Bad $\\frac{1}{$ formula.\n\nAfter paragraph.')
    const error = container.querySelector('.katex-error') as HTMLElement
    expect(error).toBeTruthy()
    expect(error.style.color).toBe('rgb(248, 113, 113)')
    expect(screen.getByText('After paragraph.')).toBeTruthy()
  })
})

describe('MarkdownView — code and diagrams (AC-F5)', () => {
  it('routes a go fence to a highlighted CodeBlock with a copy button', async () => {
    const { container } = renderMd('```go\nfmt.Println("hi")\n```')
    await waitFor(() => expect(container.querySelector('.shiki[data-lang="go"]')).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy()
  })

  it('keeps inline code inline, without a copy button', () => {
    const { container } = renderMd('Use `go run` now.')
    expect(container.querySelector('p code')!.textContent).toBe('go run')
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull()
  })

  it('routes a mermaid fence to a diagram', async () => {
    renderMd('```mermaid\ngraph TD; A-->B\n```')
    expect(await screen.findByTestId('diagram')).toBeTruthy()
    expect(renderDiagram).toHaveBeenCalledWith(expect.any(String), 'graph TD; A-->B')
  })

  it('an invalid diagram shows an error box while math and paragraphs around it still render (S08-4)', async () => {
    vi.mocked(renderDiagram).mockRejectedValue(new Error('Parse error on line 1'))
    const { container } = renderMd('Before.\n\n```mermaid\ngraph ???\n```\n\n$$x^2$$\n\nAfter.')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Parse error on line 1')
    expect(alert.textContent).toContain('graph ???')
    expect(screen.getByText('Before.')).toBeTruthy()
    expect(screen.getByText('After.')).toBeTruthy()
    expect(container.querySelector('.katex-display')).toBeTruthy()
  })
})

describe('MarkdownView — XSS (AC-F6, S08-5)', () => {
  const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '[x](javascript:alert(1))',
    '[x](data:text/html,<script>alert(1)</script>)',
    '![x](javascript:alert(1))',
    '<iframe src="https://evil"></iframe>',
    '<a href="https://x" onclick="alert(1)">x</a>',
    '$$\\href{javascript:alert(1)}{x}$$',
  ]

  it.each(payloads)('%s leaves no executable markup', (payload) => {
    const { container } = renderMd(`Intro\n\n${payload}\n\nOutro`)
    expect(container.querySelector('script, iframe, object, embed')).toBeNull()
    for (const node of container.querySelectorAll('*')) {
      for (const attr of node.getAttributeNames()) {
        expect(attr.toLowerCase().startsWith('on'), `${node.tagName} has ${attr}`).toBe(false)
      }
      for (const attr of ['href', 'src']) {
        const value = (node.getAttribute(attr) ?? '').trim().toLowerCase()
        expect(value.startsWith('javascript:') || value.startsWith('data:'), `${node.tagName} ${attr}=${value}`).toBe(false)
      }
    }
    expect(screen.getByText('Outro')).toBeTruthy()
  })
})

describe('MarkdownView — the studies schema is in the pipeline (§9.3, S08-5/6)', () => {
  // react-markdown's own urlTransform lets these protocols through; only
  // studiesSchema (href: http, https, mailto) removes them.
  it.each([
    ['[chat](xmpp:me@example.com)', 'chat'],
    ['[irc](irc:irc.example.com)', 'irc'],
  ])('%s keeps no href', (md, text) => {
    const { container } = renderMd(md)
    expect(screen.getByText(text)).toBeTruthy()
    expect(container.querySelector('a[href]')).toBeNull()
  })
})

describe('MarkdownView — KaTeX trust is off (§9.3, S08-1)', () => {
  // With trust off, KaTeX prints an untrusted command's name in errorColor
  // instead of emitting the class, link or image it would produce.
  it.each([
    ['$\\htmlClass{pwn}{y}$', '\\htmlClass'],
    ['$\\href{https://example.com}{x}$', '\\href'],
    ['$\\includegraphics{https://x/a.png}$', '\\includegraphics'],
  ])('%s renders as error-coloured text, never as markup', (md, command) => {
    const { container } = renderMd(md)
    expect(container.querySelector('.pwn, a[href], img')).toBeNull()
    const shownInErrorColor = [...container.querySelectorAll<HTMLElement>('.katex-html span')].some(
      (s) => s.textContent === command && s.style.color === 'rgb(248, 113, 113)'
    )
    expect(shownInErrorColor, `${command} not shown as error-coloured text`).toBe(true)
  })
})

describe('MarkdownView — fences (F6)', () => {
  it('an empty fence renders an empty code block, not an object string', async () => {
    const { container } = renderMd('```go\n```')
    await waitFor(() => expect(container.querySelector('pre, .shiki')).toBeTruthy())
    expect(container.textContent).not.toContain('[object Object]')
  })

  it('an empty mermaid fence reaches Mermaid as empty source', async () => {
    renderMd('```mermaid\n```')
    await waitFor(() => expect(renderDiagram).toHaveBeenCalled())
    expect(vi.mocked(renderDiagram).mock.calls[0][1]).toBe('')
  })
})

describe('MarkdownView — footnotes (GFM, F7)', () => {
  // react-markdown 10 + remark-gfm 4 emit the reference but no definitions
  // section here, so a linked reference would dangle: it renders as plain text.
  it('a footnote reference shows its number and leaves no dangling in-page link', () => {
    const { container } = renderMd('Claim[^1].\n\n[^1]: Source.')
    expect(container.querySelector('sup')!.textContent).toBe('1')
    const anchors = [...container.querySelectorAll('a[href^="#"]')]
    for (const a of anchors) {
      const target = decodeURIComponent(a.getAttribute('href')!.slice(1))
      expect(container.querySelector(`[id="${target}"]`), `${a.getAttribute('href')} has no target`).toBeTruthy()
    }
  })
})

describe('MarkdownView — links (FR-6, S08-7)', () => {
  it('an internal path is a router link that navigates client-side', async () => {
    renderMd('[lab](/slab/ud/operative-systems)')
    const probe = screen.getByTestId('location')
    const link = screen.getByRole('link', { name: 'lab' })
    expect(link.getAttribute('target')).toBeNull()
    fireEvent.click(link)
    await waitFor(() => expect(probe.textContent).toBe('/slab/ud/operative-systems'))
    expect(screen.getByTestId('location')).toBe(probe) // same document, no reload
  })

  it.each([
    ['[ext](https://example.com)', 'ext', 'https://example.com'],
    ['[mail](mailto:me@example.com)', 'mail', 'mailto:me@example.com'],
    ['[proto](//evil.com)', 'proto', '//evil.com'],
  ])('%s opens in a new tab with noopener', (md, name, href) => {
    renderMd(md)
    const link = screen.getByRole('link', { name })
    expect(link.getAttribute('href')).toBe(href)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('a fragment link stays a plain same-tab anchor', () => {
    renderMd('[frag](#x)')
    const link = screen.getByRole('link', { name: 'frag' })
    expect(link.getAttribute('href')).toContain('#x')
    expect(link.getAttribute('target')).toBeNull()
  })

  it('a link whose href the sanitizer removed renders as text', () => {
    const { container } = renderMd('[bad](javascript:alert(1)) end')
    expect(screen.getByText(/bad/)).toBeTruthy()
    expect(container.querySelector('a[href]')).toBeNull()
  })
})

describe('MarkdownView — images (S08-8)', () => {
  it('renders an https image lazily without a referrer', () => {
    const { container } = renderMd('![a](https://x.test/a.png)')
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://x.test/a.png')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer')
  })

  it.each(['![b](http://x.test/b.png)', '![c](./c.png)'])('%s renders only its alt text', (md) => {
    const { container } = renderMd(md)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toMatch(/[bc]/)
  })
})

describe('MarkdownView — GFM (S08-10)', () => {
  it('renders tables, task lists, strikethrough and autolinks', () => {
    const { container } = renderMd(
      '| a | b |\n|---|---|\n| 1 | 2 |\n\n- [ ] todo\n- [x] done\n\n~~gone~~\n\nSee https://example.com now'
    )
    expect(container.querySelector('table')).toBeTruthy()
    const boxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    expect(boxes).toHaveLength(2)
    expect([...boxes].map((b) => [b.disabled, b.checked])).toEqual([[true, false], [true, true]])
    expect(container.querySelector('del')!.textContent).toBe('gone')
    expect(screen.getByRole('link', { name: 'https://example.com' }).getAttribute('target')).toBe('_blank')
  })
})
