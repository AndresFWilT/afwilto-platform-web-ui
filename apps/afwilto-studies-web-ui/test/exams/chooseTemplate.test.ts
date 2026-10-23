import { describe, it, expect } from 'vitest'
import { chooseTemplate } from '../../src/exams/domain'
import type { ViewOption } from '../../src/exams/domain'

const SHA = 'a'.repeat(64)
const text = (label: string): ViewOption => ({ label, text: `Option ${label}` })
const image = (label: string): ViewOption => ({ label, image: `media:${SHA}`, alt: `Imagen ${label}` })

// S07-1 / AC-22: the template is derived from the content alone.
describe('chooseTemplate (S07-1)', () => {
  const cases: Array<{ name: string; stem: string; options: ViewOption[]; expected: string }> = [
    { name: 'text stem + text options', stem: 'Which service stores objects?', options: [text('A'), text('B')], expected: 'text-list' },
    { name: 'media: image in the stem + text options', stem: `¿Qué indica?\n\n![Disco](media:${SHA})`, options: [text('A'), text('B')], expected: 'media-stem' },
    { name: 'any option with an image (text stem)', stem: '¿Cuál es la señal?', options: [image('A'), text('B')], expected: 'option-cards' },
    { name: 'an https image in the stem + text options: only media: counts', stem: '![x](https://example.com/x.png)', options: [text('A'), text('B')], expected: 'text-list' },
    { name: 'mixed image and text options', stem: 'Pick one', options: [text('A'), image('B'), text('C')], expected: 'option-cards' },
    { name: 'media: stem image + an option image: option cards win', stem: `![x](media:${SHA})`, options: [image('A'), text('B')], expected: 'option-cards' },
  ]

  it.each(cases)('$name → $expected', ({ stem, options, expected }) => {
    expect(chooseTemplate({ stem, options })).toBe(expected)
  })
})
