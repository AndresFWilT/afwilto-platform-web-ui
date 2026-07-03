const BASE = import.meta.env.VITE_API_URL as string

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, init)
  if (res.status === 204) return undefined as T
  const json = await res.json() as unknown
  if (!res.ok) throw new Error((json as { error: string }).error ?? `HTTP ${res.status}`)
  return (json as { data: T }).data
}

export const api = {
  get:   <T>(path: string)                => request<T>('GET',    path),
  post:  <T>(path: string, body: unknown) => request<T>('POST',   path, body),
  put:   <T>(path: string, body: unknown) => request<T>('PUT',    path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH',  path, body),
  del:   <T>(path: string)                => request<T>('DELETE', path),
}
