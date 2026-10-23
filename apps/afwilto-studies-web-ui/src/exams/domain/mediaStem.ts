export interface StemImage {
  alt: string
  sha: string
}

/** A Markdown image whose source is a `media:` reference. */
const MEDIA_IMAGE = /!\[([^\]]*)\]\(\s*media:([^)\s]+)\s*\)/g

export function hasMediaImage(stem: string): boolean {
  return new RegExp(MEDIA_IMAGE.source).test(stem)
}

/** Splits `media:` images out of a Markdown stem; other Markdown (https images included) stays in `text`. */
export function splitMediaStem(stem: string): { text: string; images: StemImage[] } {
  const images = [...stem.matchAll(MEDIA_IMAGE)].map((m) => ({ alt: m[1], sha: m[2] }))
  if (images.length === 0) return { text: stem, images }
  const text = stem
    .replace(MEDIA_IMAGE, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { text, images }
}
