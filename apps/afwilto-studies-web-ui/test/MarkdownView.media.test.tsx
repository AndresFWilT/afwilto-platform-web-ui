import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownView } from '../src/features/markdown/MarkdownView'

const SHA = 'ab12'.repeat(16)

// Spec 18 slice 07 §1.2 / S07-2: `media:<sha256>` images resolve only through a caller-supplied resolver.
describe('MarkdownView — media: images (S07-2)', () => {
  it('without a resolver renders the alt text and requests nothing', () => {
    const { container } = render(<MarkdownView content={`![x](media:${SHA})`} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('x')
  })

  it('with a resolver renders <img src alt loading="lazy"> from the resolved URL', () => {
    const { container } = render(<MarkdownView content={`![x](media:${SHA})`} resolveMediaUrl={(sha) => `/m/${sha}`} />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe(`/m/${SHA}`)
    expect(img.getAttribute('alt')).toBe('x')
    expect(img.getAttribute('loading')).toBe('lazy')
  })

  it('hands the resolver the bare sha256, without the media: scheme', () => {
    const resolve = vi.fn(() => '/m/x')
    render(<MarkdownView content={`![x](media:${SHA})`} resolveMediaUrl={resolve} />)
    expect(resolve).toHaveBeenCalledWith(SHA)
  })

  it('falls back to the alt text when the resolver returns null', () => {
    const { container } = render(<MarkdownView content={`![sin imagen](media:${SHA})`} resolveMediaUrl={() => null} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('sin imagen')
  })

  it('a media: reference that is not a 64-hex sha256 renders its alt and never reaches the resolver', () => {
    const resolve = vi.fn(() => '/m/x')
    const { container } = render(<MarkdownView content="![raw](media:img/r101.png)" resolveMediaUrl={resolve} />)
    expect(resolve).not.toHaveBeenCalled()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('raw')
  })

  it('still drops javascript: sources, with or without a resolver', () => {
    const resolve = vi.fn(() => '/m/x')
    const { container } = render(<MarkdownView content="![bad](javascript:alert(1))" resolveMediaUrl={resolve} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.innerHTML).not.toContain('javascript:')
    expect(resolve).not.toHaveBeenCalled()
  })

  it('keeps https images working when a resolver is present', () => {
    const { container } = render(<MarkdownView content="![logo](https://example.com/l.png)" resolveMediaUrl={() => '/unused'} />)
    expect(container.querySelector('img')!.getAttribute('src')).toBe('https://example.com/l.png')
  })

  it('does not let a media: link slip through as an href', () => {
    const { container } = render(<MarkdownView content={`[go](media:${SHA})`} resolveMediaUrl={(s) => `/m/${s}`} />)
    expect(container.querySelector('a')?.getAttribute('href') ?? null).toBeNull()
  })
})
