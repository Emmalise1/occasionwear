import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold uppercase tracking-[0.18em] transition ${
    isActive ? 'text-gold' : 'text-ivory/80 hover:text-gold'
  }`

export function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const close = () => setOpen(false)

  const handleLogout = () => {
    logout()
    close()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-ink text-ivory">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-3"
          onClick={close}
          aria-label="OccasionWear home"
        >
          <img src="/logo.svg" alt="" className="h-9 w-9" aria-hidden="true" />
          <span className="font-display text-lg tracking-wide text-ivory">
            Occasion<span className="text-gold">Wear</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          <NavLink to="/outfits" className={navLinkClass}>
            Collection
          </NavLink>
          {user && (
            <NavLink to="/my-bookings" className={navLinkClass}>
              My Bookings
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-gold/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Log in
              </NavLink>
              <Link
                to="/register"
                onClick={close}
                className="rounded-md bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-gold-dark hover:text-ivory"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="rounded-md p-2 text-ivory md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="flex flex-col gap-4 border-t border-gold/20 bg-ink px-6 py-5 md:hidden"
        >
          <NavLink to="/outfits" className={navLinkClass} onClick={close}>
            Collection
          </NavLink>
          {user && (
            <NavLink to="/my-bookings" className={navLinkClass} onClick={close}>
              My Bookings
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass} onClick={close}>
              Admin Dashboard
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/profile" className={navLinkClass} onClick={close}>
                Profile
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-md border border-gold/50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gold"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={close}>
                Log in
              </NavLink>
              <NavLink to="/register" className={navLinkClass} onClick={close}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
