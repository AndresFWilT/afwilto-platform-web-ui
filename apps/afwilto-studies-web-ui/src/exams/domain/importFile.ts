export const JSON_MAX_BYTES = 10 * 1024 * 1024
export const ZIP_MAX_BYTES = 50 * 1024 * 1024

/** Why a chosen file cannot be imported, or null when it can be sent (the server repeats these limits, FR-4). */
export function importFileProblem(file: { name: string; size: number }): string | null {
  const name = file.name.toLowerCase()
  const kind = name.endsWith('.json') ? 'json' : name.endsWith('.zip') ? 'zip' : null
  if (kind === null) return 'Elige un archivo .json o .zip'
  if (file.size === 0) return 'El archivo está vacío'
  if (kind === 'json' && file.size > JSON_MAX_BYTES) return 'Un archivo .json admite hasta 10 MiB'
  if (kind === 'zip' && file.size > ZIP_MAX_BYTES) return 'Un archivo .zip admite hasta 50 MiB'
  return null
}
