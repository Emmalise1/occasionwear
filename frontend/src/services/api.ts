/**
 * Thin REST client for the Spring Boot API.
 * Every backend URL comes from VITE_API_BASE_URL — nothing is hard-coded
 * throughout the React application.
 */

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080/api'

const TOKEN_KEY = 'occasionwear.token'

/** Normalized error: backend JSON errors and network failures become ApiError. */
export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Pass null to explicitly send no token (login/register). */
  token?: string | null
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options
  const token = options.token === undefined ? getStoredToken() : options.token

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Cannot reach the server. Make sure the Spring Boot backend is running on port 8080.',
    )
  }

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const payload = data as { error?: string; message?: string } | null
    throw new ApiError(
      response.status,
      payload?.error ?? 'ERROR',
      payload?.message ?? `Request failed with status ${response.status}.`,
    )
  }

  return data as T
}

/** Builds "?a=1&b=2" from defined values; empty string when nothing is set. */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  }
  const s = query.toString()
  return s ? `?${s}` : ''
}
