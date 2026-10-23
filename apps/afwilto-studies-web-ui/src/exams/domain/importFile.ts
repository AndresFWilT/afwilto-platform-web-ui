export const JSON_MAX_BYTES = 10 * 1024 * 1024
export const ZIP_MAX_BYTES = 50 * 1024 * 1024

/** Why a chosen file cannot be imported, or null when it can be sent (the server repeats these limits, FR-4). */
export function importFileProblem(_file: { name: string; size: number }): string | null {
  throw new Error('not implemented')
}
