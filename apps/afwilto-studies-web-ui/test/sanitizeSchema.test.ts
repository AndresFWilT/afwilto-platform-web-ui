import { describe, it, expect } from 'vitest'
import rehypeSanitize from 'rehype-sanitize'
import type { Element, Root } from 'hast'
import { studiesSchema } from '../src/features/markdown/sanitizeSchema'

function el(tagName: string, properties: Element['properties'] = {}, text = 'x'): Element {
  return { type: 'element', tagName, properties, children: [{ type: 'text', value: text }] }
}

/** Runs the real rehype-sanitize transformer with our schema over one element. */
function sanitizeOne(node: Element): Element | undefined {
  const tree: Root = { type: 'root', children: [node] }
  const transform = rehypeSanitize(studiesSchema) as unknown as (tree: Root) => Root
  return transform(tree).children.find((c): c is Element => c.type === 'element')
}

describe('studiesSchema (AC-F6, S08-6)', () => {
  it('allows exactly http, https and mailto for href, and https and media for src (Spec 18 slice 07)', () => {
    expect(studiesSchema.protocols?.['href']).toEqual(['http', 'https', 'mailto'])
    expect(studiesSchema.protocols?.['src']).toEqual(['https', 'media'])
  })

  it.each([
    ['https://example.com', true],
    ['http://example.com', true],
    ['mailto:me@example.com', true],
    ['/slab/ud/os', true],
    ['#frag', true],
    ['javascript:alert(1)', false],
    ['data:text/html,x', false],
    ['ftp://example.com', false],
  ])('href %s kept: %s', (href, kept) => {
    const a = sanitizeOne(el('a', { href }))!
    expect(a.properties['href'] !== undefined).toBe(kept)
  })

  it.each([
    ['https://x/a.png', true],
    [`media:${'a'.repeat(64)}`, true],
    ['http://x/a.png', false],
    ['data:image/png;base64,AAAA', false],
    ['javascript:alert(1)', false],
  ])('img src %s kept: %s', (src, kept) => {
    const img = sanitizeOne({ type: 'element', tagName: 'img', properties: { src, alt: 'a' }, children: [] })!
    expect(img.properties['src'] !== undefined).toBe(kept)
  })

  it.each([['language-go'], ['math-inline'], ['math-display']])('code keeps class %s', (cls) => {
    const code = sanitizeOne(el('code', { className: [cls] }))!
    expect(code.properties['className']).toEqual([cls])
  })

  it('code drops an unknown class', () => {
    const code = sanitizeOne(el('code', { className: ['evil', 'language-go'] }))!
    expect(code.properties['className']).toEqual(['language-go'])
  })

  it('drops event handlers and style everywhere', () => {
    const div = sanitizeOne(el('div', { onClick: 'alert(1)', onMouseOver: 'x', style: 'color:red', title: 't' }))!
    expect(Object.keys(div.properties)).toEqual(['title'])
  })

  it.each(['script', 'iframe', 'object', 'embed', 'form', 'style'])('removes <%s> entirely', (tag) => {
    const out = sanitizeOne(el(tag, {}, 'payload'))
    expect(out?.tagName === tag).toBe(false)
  })

  it('declares no on* or style attribute for any element', () => {
    const declared = Object.values(studiesSchema.attributes ?? {})
      .flat()
      .map((a) => (Array.isArray(a) ? a[0] : a))
      .map(String)
    expect(declared.filter((a) => /^on/i.test(a) || a === 'style')).toEqual([])
  })
})
