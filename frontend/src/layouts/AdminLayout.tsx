import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/bookings', label: 'Bookings', end: false },
  { to: '/admin/returns', label: 'Returns', end: false },
  { to: '/admin/inventory', label: 'Inventory', end: false },
  { to: '/admin/reports', label: 'Reports', end: false },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="min-h-screen bg-ivory">
      <header className="sticky top-0 z-40 border-b border-gold/20 bg-ink text-ivory">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-8 w-8" aria-hidden="true" />
            <span className="font-display text-lg">
              Occasion<span className="text-gold">Wear</span>
              <span className="ml-3 rounded border border-gold/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                Admin
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden text-ivory/70 sm:inline">
              {user?.name}
              {user?.staffRole ? ` · ${user.staffRole}` : ''}
            </span>
            <NavLink
              to="/"
              className="text-ivory/70 uppercase tracking-[0.18em] transition hover:text-gold"
            >
              Storefront
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-gold/50 px-3 py-1.5 font-semibold uppercase tracking-[0.16em] text-gold transition hover:bg-gold hover:text-ink"
            >
              Log out
            </button>
          </div>
        </div>

        <nav
          aria-label="Admin navigation"
          className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-t-md border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  isActive
                    ? 'border-gold text-gold'
                    : 'border-transparent text-ivory/60 hover:text-ivory'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
