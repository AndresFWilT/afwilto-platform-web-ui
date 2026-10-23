import { describe, it, expect } from 'vitest'
import { hasMediaImage, splitMediaStem } from '../../src/exams/domain'

const SHA = 'b'.repeat(64)

describe('splitMediaStem', () => {
  it('lifts a media: image out of the stem and keeps its alt', () => {
    expect(splitMediaStem(`¿Qué indica esta señal?\n\n![Disco rojo](media:${SHA})`)).toEqual({
      text: '¿Qué indica esta señal?',
      images: [{ alt: 'Disco rojo', sha: SHA }],
    })
  })

  it('keeps https images and plain text in the text', () => {
    const stem = 'See ![logo](https://example.com/l.png) here'
    expect(splitMediaStem(stem)).toEqual({ text: stem, images: [] })
  })

  it('lifts several images in order and leaves no run of blank lines', () => {
    const out = splitMediaStem(`A\n\n![one](media:${SHA})\n\nB\n\n![two](media:${'c'.repeat(64)})\n\nC`)
    expect(out.images.map((i) => i.alt)).toEqual(['one', 'two'])
    expect(out.text).toBe('A\n\nB\n\nC')
  })

  it('returns empty text for a stem that is only an image', () => {
    expect(splitMediaStem(`![x](media:${SHA})`)).toEqual({ text: '', images: [{ alt: 'x', sha: SHA }] })
  })

  describe('code is not a media image (review fix 14)', () => {
    const ref = `![x](media:${SHA})`

    it('leaves a reference inside a fenced code block in the text', () => {
      const stem = `Mira el ejemplo:\n\n\`\`\`md\n${ref}\n\`\`\`\n\nFin`
      expect(splitMediaStem(stem)).toEqual({ text: stem, images: [] })
      expect(hasMediaImage(stem)).toBe(false)
    })

    it('leaves a reference inside a ~~~ fence, and inside an unclosed fence, in the text', () => {
      const tilde = `~~~\n${ref}\n~~~`
      expect(splitMediaStem(tilde)).toEqual({ text: tilde, images: [] })
      const open = `texto\n\`\`\`\n${ref}`
      expect(splitMediaStem(open)).toEqual({ text: open, images: [] })
    })

    it('leaves a reference inside an inline code span in the text', () => {
      const stem = `Escribe \`${ref}\` para incluir una imagen`
      expect(splitMediaStem(stem)).toEqual({ text: stem, images: [] })
      expect(hasMediaImage(stem)).toBe(false)
    })

    it('still lifts a real image that sits next to code', () => {
      const other = 'c'.repeat(64)
      const out = splitMediaStem(`\`${ref}\`\n\n![real](media:${other})\n\n\`\`\`\n${ref}\n\`\`\``)
      expect(out.images).toEqual([{ alt: 'real', sha: other }])
      expect(out.text).toBe(`\`${ref}\`\n\n\`\`\`\n${ref}\n\`\`\``)
      expect(hasMediaImage(`\`${ref}\` ![real](media:${other})`)).toBe(true)
    })
  })
})
