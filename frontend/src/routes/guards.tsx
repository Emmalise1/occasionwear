import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingState } from '../components/States'
import { useAuth } from '../context/AuthContext'

/** Frontend convenience guard — the backend remains the real security boundary. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <LoadingState label="Restoring session" />
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <LoadingState label="Restoring session" />
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="label-caps text-burgundy">403 · Forbidden</p>
        <h1 className="mt-3 font-display text-3xl text-ink">Administrator access only</h1>
        <p className="mt-3 text-sm text-ink/60">
          You are signed in as a customer. Admin endpoints require an ADMIN role — the backend
          enforces this on every request.
        </p>
        <a href="/" className="btn-outline mt-6">
          Back to storefront
        </a>
      </div>
    )
  }
  return <>{children}</>
}
