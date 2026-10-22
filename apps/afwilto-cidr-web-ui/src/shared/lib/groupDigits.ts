/**
 * "79228162514264337593543950336" → "79,228,162,514,264,337,593,543,950,336".
 * Pure string work: the numbers can exceed 2^53, so they are never parsed.
 */
export function groupDigits(digits: string): string {
  if (!/^\d+$/.test(digits)) return digits
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
