const BASE = '/api'

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export async function loginApi(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string }
    throw new Error(err.detail ?? 'Login failed')
  }
  return res.json() as Promise<TokenResponse>
}

export async function refreshApi(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error('Session expired')
  return res.json() as Promise<TokenResponse>
}
