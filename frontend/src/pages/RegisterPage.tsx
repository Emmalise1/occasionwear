import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface FormState {
  name: string
  email: string
  phone: string
  address: string
  password: string
  confirmPassword: string
}

const EMPTY: FormState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
}

export function RegisterPage() {
  const { register, user, initializing } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!initializing && user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/'} replace />
  }

  const set = (key: keyof FormState) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!form.phone.trim()) next.phone = 'Phone number is required.'
    if (!form.address.trim()) next.address = 'Address is required.'
    if (!form.password) next.password = 'Password is required.'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password.'
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setServerError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (
    key: keyof FormState,
    label: string,
    props: {
      type?: string
      autoComplete?: string
      placeholder?: string
    } = {},
  ) => (
    <div>
      <label htmlFor={`reg-${key}`} className="label-caps">
        {label}
      </label>
      <input
        id={`reg-${key}`}
        type={props.type ?? 'text'}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        value={form[key]}
        onChange={set(key)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `reg-${key}-error` : undefined}
        className="input-field mt-1.5"
      />
      {errors[key] && (
        <p id={`reg-${key}-error`} role="alert" className="mt-1 text-xs text-burgundy">
          {errors[key]}
        </p>
      )}
    </div>
  )

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div className="hidden lg:block">
        <p className="label-caps text-gold-dark">Join OccasionWear</p>
        <h1 className="mt-3 text-4xl text-ink">
          Create your
          <span className="block italic text-burgundy">occasion account</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/60">
          Register to browse availability, reserve outfits for your dates and manage every rental
          from one place. It only takes a minute.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-ink/70">
          <li>· Guaranteed availability for your full rental period</li>
          <li>· Transparent pricing — deposit refunded after inspection</li>
          <li>· Email &amp; SMS updates at every step</li>
        </ul>
      </div>

      <form onSubmit={submit} className="card p-7" noValidate aria-labelledby="register-heading">
        <h2 id="register-heading" className="font-display text-2xl text-ink">
          Register
        </h2>

        {serverError && (
          <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field('name', 'Full name', { autoComplete: 'name', placeholder: 'Aline Uwase' })}</div>
          {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
          {field('phone', 'Phone', { autoComplete: 'tel', placeholder: '+250 7.. ... ...' })}
          <div className="sm:col-span-2">{field('address', 'Address', { autoComplete: 'street-address', placeholder: 'KN 4 Avenue, Kigali' })}</div>
          {field('password', 'Password', { type: 'password', autoComplete: 'new-password', placeholder: 'Min. 8 characters' })}
          {field('confirmPassword', 'Confirm password', { type: 'password', autoComplete: 'new-password', placeholder: 'Repeat password' })}
        </div>

        <button type="submit" className="btn-primary mt-6 w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-sm text-ink/60">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-burgundy underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
