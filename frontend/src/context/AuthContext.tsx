import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginApi, refreshApi, type TokenResponse } from '@/api/auth'

interface AuthContextValue {
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const navigate = useNavigate()

  // Ref so fetchWithAuth always sees the latest tokens without needing re-creation
  const tokensRef = useRef({ accessToken, refreshToken })
  tokensRef.current = { accessToken, refreshToken }

  const applyTokens = useCallback((data: TokenResponse) => {
    setAccessToken(data.access_token)
    setRefreshToken(data.refresh_token)
  }, [])

  const logout = useCallback(() => {
    setAccessToken(null)
    setRefreshToken(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password)
    applyTokens(data)
    navigate('/dashboard', { replace: true })
  }, [applyTokens, navigate])

  const fetchWithAuth = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    const { accessToken: at, refreshToken: rt } = tokensRef.current
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> ?? {}),
    }
    if (at) headers['Authorization'] = `Bearer ${at}`

    let res = await fetch(url, { ...options, headers })

    if (res.status === 401 && rt) {
      try {
        const fresh = await refreshApi(rt)
        applyTokens(fresh)
        const retryHeaders = { ...headers, Authorization: `Bearer ${fresh.access_token}` }
        res = await fetch(url, { ...options, headers: retryHeaders })
      } catch {
        logout()
      }
    }

    return res
  }, [applyTokens, logout])

  return (
    <AuthContext.Provider value={{ accessToken, login, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
