export const JSON_MAX_BYTES = 10 * 1024 * 1024
export const ZIP_MAX_BYTES = 50 * 1024 * 1024

/** Why a chosen file cannot be imported, or null when it can be sent (the server repeats these limits, FR-4). */
export function importFileProblem(file: { name: string; size: number }): string | null {
  const name = file.name.toLowerCase()
  const kind = name.endsWith('.json') ? 'json' : name.endsWith('.zip') ? 'zip' : null
  if (kind === null) return 'Choose a .json or .zip file'
  if (file.size === 0) return 'The file is empty'
  if (kind === 'json' && file.size > JSON_MAX_BYTES) return 'A .json file can be up to 10 MiB'
  if (kind === 'zip' && file.size > ZIP_MAX_BYTES) return 'A .zip file can be up to 50 MiB'
  return null
}
