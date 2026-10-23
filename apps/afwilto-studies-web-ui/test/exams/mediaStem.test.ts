import { describe, it, expect } from 'vitest'
import { splitMediaStem } from '../../src/exams/domain'

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
})
