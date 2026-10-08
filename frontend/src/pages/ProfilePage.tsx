import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <p className="label-caps text-gold-dark">Account</p>
      <h1 className="mt-2 text-4xl text-ink">Profile</h1>

      <section className="card mt-8 overflow-hidden" aria-labelledby="profile-details">
        <div className="flex items-center gap-4 border-b border-taupe bg-white px-6 py-5">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-display text-xl text-gold"
            aria-hidden="true"
          >
            {user.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('')}
          </span>
          <div>
            <h2 id="profile-details" className="font-display text-xl text-ink">
              {user.name}
            </h2>
            <span
              className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                user.role === 'ADMIN'
                  ? 'border-burgundy/30 bg-burgundy/10 text-burgundy'
                  : 'border-gold/50 bg-gold/15 text-gold-dark'
              }`}
            >
              {user.role === 'ADMIN' ? `Admin${user.staffRole ? ` · ${user.staffRole}` : ''}` : 'Customer'}
            </span>
          </div>
        </div>

        <dl className="divide-y divide-taupe bg-white px-6 text-sm">
          <Field label="Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Phone" value={user.phone} />
          <Field label="Address" value={user.address ?? '—'} />
          <Field label="Role" value={user.role} />
        </dl>

        <div className="flex flex-wrap gap-3 border-t border-taupe bg-white px-6 py-5">
          <Link to="/my-bookings" className="btn-outline px-4 py-2.5">
            My bookings
          </Link>
          {user.role === 'ADMIN' && (
            <Link to="/admin" className="btn-gold px-4 py-2.5">
              Admin dashboard
            </Link>
          )}
          <button type="button" onClick={handleLogout} className="btn-primary px-4 py-2.5">
            Log out
          </button>
        </div>
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <dt className="text-ink/50">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  )
}
