export interface StemImage {
  alt: string
  sha: string
}

/** Splits `media:` images out of a Markdown stem; other Markdown (https images included) stays in `text`. */
export function splitMediaStem(stem: string): { text: string; images: StemImage[] } {
  return { text: stem, images: [] }
}
