import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearStoredToken, getStoredToken, setStoredToken } from '../services/api'
import { authService, type RegisterPayload } from '../services/authService'
import type { AuthResponse, PersonResponse } from '../types'

interface AuthContextValue {
  user: PersonResponse | null
  token: string | null
  /** True while the stored token is being validated on first load. */
  initializing: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthResponse>
  register: (payload: RegisterPayload) => Promise<AuthResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PersonResponse | null>(null)
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [initializing, setInitializing] = useState<boolean>(() => !!getStoredToken())

  // Validate a stored token on first load so refreshes keep the session.
  useEffect(() => {
    let cancelled = false
    if (!token) {
      setInitializing(false)
      return
    }
    authService
      .me()
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredToken()
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password)
    setStoredToken(response.token)
    setToken(response.token)
    setUser(toProfile(response))
    return response
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload)
    setStoredToken(response.token)
    setToken(response.token)
    setUser(toProfile(response))
    return response
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      initializing,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [user, token, initializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function toProfile(response: AuthResponse): PersonResponse {
  return {
    id: response.id,
    name: response.name,
    email: response.email,
    phone: response.phone,
    role: response.role,
    address: response.address,
    staffRole: response.staffRole,
  }
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}

/** Extracts the backend error message from a thrown ApiError. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
