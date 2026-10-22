/** Pasted text → address entries: split on whitespace, commas or semicolons; drop blanks. */
export function splitAddressList(text: string): string[] {
  return text.split(/[\s,;]+/).filter(Boolean)
}
