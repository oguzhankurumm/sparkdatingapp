/**
 * Spark API Client
 *
 * Typed fetch wrapper with:
 * - Bearer token from localStorage
 * - 401 → automatic refresh → retry
 * - Typed helper methods: get, post, put, patch, delete
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const TOKEN_KEY = 'spark_access_token'
const REFRESH_TOKEN_KEY = 'spark_refresh_token'

interface ApiError {
  message: string
  statusCode: number
  error?: string
}

class ApiClient {
  private accessToken: string | null = null
  private refreshPromise: Promise<boolean> | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem(TOKEN_KEY)
    }
  }

  /**
   * Store both access and refresh tokens.
   * Called after successful login / register / token refresh.
   *
   * Sets localStorage (for JS reads) AND a cookie (for Next.js middleware).
   */
  setTokens(access: string, refresh: string): void {
    this.accessToken = access
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, access)
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
      // Set a cookie so that Next.js middleware can detect auth state.
      // SameSite=Lax is fine — we only need this for same-site navigation checks.
      document.cookie = `${TOKEN_KEY}=${access}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
    }
  }

  /**
   * Remove all tokens. Called on logout or unrecoverable 401.
   */
  clearTokens(): void {
    this.accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      // Expire the cookie
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`
    }
  }

  /**
   * Check if an access token is present (not whether it is valid).
   */
  hasToken(): boolean {
    return !!this.accessToken
  }

  // ──────────────────────────────────────────────
  // Public HTTP helpers
  // ──────────────────────────────────────────────

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }

  // ──────────────────────────────────────────────
  // Internal
  // ──────────────────────────────────────────────

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers)
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json')
    }

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`)
    }

    const url = `${API_URL}${path}`
    const res = await fetch(url, { ...options, headers })

    // ── Handle 401 → try refresh → retry once ──
    if (res.status === 401) {
      const refreshed = await this.tryRefresh()
      if (refreshed) {
        headers.set('Authorization', `Bearer ${this.accessToken}`)
        const retryRes = await fetch(url, { ...options, headers })

        if (!retryRes.ok) {
          throw await this.parseError(retryRes)
        }

        if (retryRes.status === 204) return undefined as T
        return retryRes.json() as Promise<T>
      }

      // Refresh failed — clear tokens and redirect to login
      this.clearTokens()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new ApiClientError('Session expired. Please log in again.', 401)
    }

    if (!res.ok) {
      throw await this.parseError(res)
    }

    // 204 No Content
    if (res.status === 204) return undefined as T

    return res.json() as Promise<T>
  }

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * De-duplicates concurrent refresh requests.
   */
  private async tryRefresh(): Promise<boolean> {
    // If a refresh is already in-flight, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performRefresh()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async performRefresh(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return false

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!res.ok) return false

      const data = (await res.json()) as {
        accessToken: string
        refreshToken: string
      }

      this.setTokens(data.accessToken, data.refreshToken)
      return true
    } catch {
      return false
    }
  }

  private async parseError(res: Response): Promise<ApiClientError> {
    let body: ApiError | null = null
    try {
      body = (await res.json()) as ApiError
    } catch {
      // Response was not JSON
    }

    const message = body?.message || `Request failed with status ${res.status}`
    return new ApiClientError(message, res.status, body?.error)
  }
}

/**
 * Typed error thrown by ApiClient.
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly error?: string,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

/** Singleton instance — import and use everywhere */
export const api = new ApiClient()
