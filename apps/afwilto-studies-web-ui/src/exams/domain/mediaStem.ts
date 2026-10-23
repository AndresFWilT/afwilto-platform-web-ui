export interface StemImage {
  alt: string
  sha: string
}

/** A Markdown image whose source is a `media:` reference. */
const MEDIA_IMAGE = /!\[([^\]]*)\]\(\s*media:([^)\s]+)\s*\)/g

/** `[start, end)` ranges of fenced code blocks (``` or ~~~, an unclosed one runs to the end) and inline code spans. */
function codeRanges(stem: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  let offset = 0
  let fence: { marker: string; start: number } | undefined
  for (const line of stem.split('\n')) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (fence) {
      if (marker && marker[0] === fence.marker[0] && marker.length >= fence.marker.length) {
        ranges.push([fence.start, offset + line.length])
        fence = undefined
      }
    } else if (marker) {
      fence = { marker, start: offset }
    } else {
      // Inline spans only exist outside fences.
      for (const span of line.matchAll(/(`+)(?!`)[\s\S]*?[^`]\1(?!`)/g)) ranges.push([offset + span.index, offset + span.index + span[0].length])
    }
    offset += line.length + 1
  }
  if (fence) ranges.push([fence.start, stem.length])
  return ranges
}

/** The media images of a stem that are not inside code, with their positions. */
function mediaMatches(stem: string): Array<{ start: number; end: number; image: StemImage }> {
  const code = codeRanges(stem)
  return [...stem.matchAll(MEDIA_IMAGE)]
    .map((m) => ({ start: m.index, end: m.index + m[0].length, image: { alt: m[1], sha: m[2] } }))
    .filter(({ start }) => !code.some(([from, to]) => start >= from && start < to))
}

export function hasMediaImage(stem: string): boolean {
  return mediaMatches(stem).length > 0
}

/**
 * Splits `media:` images out of a Markdown stem; other Markdown (https images included) stays in `text`.
 * A reference inside a fenced code block or an inline code span is code, not an image.
 */
export function splitMediaStem(stem: string): { text: string; images: StemImage[] } {
  const found = mediaMatches(stem)
  if (found.length === 0) return { text: stem, images: [] }
  let text = ''
  let cursor = 0
  for (const { start, end } of found) {
    text += stem.slice(cursor, start)
    cursor = end
  }
  text += stem.slice(cursor)
  return { text: text.replace(/\n{3,}/g, '\n\n').trim(), images: found.map((f) => f.image) }
}
