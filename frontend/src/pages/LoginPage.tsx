import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function LoginPage() {
  useDocumentTitle('Log in')
  const { login, user, initializing } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const next = searchParams.get('next') || '/'

  if (!initializing && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : next} replace />
  }

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {}
    if (!email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setServerError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const response = await login(email.trim(), password)
      navigate(response.role === 'ADMIN' ? '/admin' : next, { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Demo1234')
    setErrors({})
    setServerError(null)
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div className="hidden lg:block">
        <p className="label-caps text-gold-dark">Welcome back</p>
        <h1 className="mt-3 text-4xl text-ink">
          Your moment
          <span className="block italic text-burgundy">awaits</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/60">
          Sign in to manage your rentals, track returns and discover new arrivals from the
          OccasionWear collection.
        </p>

        <div className="mt-8 rounded-lg border border-taupe bg-white p-4 text-sm">
          <p className="label-caps">Demo accounts</p>
          <button
            type="button"
            className="mt-3 block text-left text-ink/70 hover:text-burgundy"
            onClick={() => fillDemo('customer@demo.com')}
          >
            Customer · <span className="font-semibold">customer@demo.com</span> / Demo1234
          </button>
          <button
            type="button"
            className="mt-1.5 block text-left text-ink/70 hover:text-burgundy"
            onClick={() => fillDemo('admin@demo.com')}
          >
            Admin · <span className="font-semibold">admin@demo.com</span> / Demo1234
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="card p-7" noValidate aria-labelledby="login-heading">
        <h2 id="login-heading" className="font-display text-2xl text-ink">
          Log in
        </h2>

        {serverError && (
          <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <div className="mt-5">
          <label htmlFor="login-email" className="label-caps">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className="input-field mt-1.5"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="login-email-error" role="alert" className="mt-1 text-xs text-burgundy">
              {errors.email}
            </p>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="login-password" className="label-caps">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            className="input-field mt-1.5"
            placeholder="••••••••"
          />
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1 text-xs text-burgundy">
              {errors.password}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-4 text-center text-sm text-ink/60">
          New to OccasionWear?{' '}
          <Link to="/register" className="font-semibold text-burgundy underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>

        <p className="mt-6 rounded-md bg-taupe/30 p-3 text-center text-xs text-ink/60 lg:hidden">
          Demo · customer@demo.com / admin@demo.com — Demo1234
        </p>
      </form>
    </div>
  )
}
