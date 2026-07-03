import type { IHttpClient, RequestOptions } from './IHttpClient'

export class FetchHttpClient implements IHttpClient {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json() as Promise<T>
  }

  get<T>(url: string, options?: RequestOptions) {
    return this.request<T>('GET', url, undefined, options)
  }

  post<T>(url: string, body: unknown, options?: RequestOptions) {
    return this.request<T>('POST', url, body, options)
  }

  put<T>(url: string, body: unknown, options?: RequestOptions) {
    return this.request<T>('PUT', url, body, options)
  }

  delete<T>(url: string, options?: RequestOptions) {
    return this.request<T>('DELETE', url, undefined, options)
  }
}
