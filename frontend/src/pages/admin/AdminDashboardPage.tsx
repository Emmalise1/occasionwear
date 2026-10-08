import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/States'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { adminService } from '../../services/adminService'
import type { ReportSummary } from '../../types'
import { errorMessage, formatRWF } from '../../utils/format'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  ACTIVE: '#10B981',
  COMPLETED: '#059669',
  CANCELLED: '#EF4444',
}

export function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard')
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminService
      .reportSummary()
      .then(setSummary)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  if (loading) return <LoadingState label="Loading dashboard" />
  if (error || !summary) {
    return <ErrorState message={error ?? 'No data available.'} onRetry={load} />
  }

  const pieData = Object.entries(summary.bookingsByStatus)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  const revenueData = summary.revenueOverTime.map((entry) => ({
    ...entry,
    revenue: Number(entry.revenue),
  }))

  const kpis = [
    { label: 'Active bookings', value: String(summary.bookingsByStatus.ACTIVE ?? 0), accent: 'text-emerald-600' },
    { label: 'Available outfits', value: String(summary.availableOutfits), accent: 'text-gold-dark' },
    { label: 'Rented out', value: String(summary.rentedOutfits), accent: 'text-blue-600' },
    { label: 'Damaged outfits', value: String(summary.damagedOutfits), accent: 'text-burgundy' },
    { label: 'Total revenue', value: formatRWF(summary.totalRevenue), accent: 'text-ink' },
  ]

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold-dark">Overview</p>
          <h1 className="mt-2 text-3xl text-ink">Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/bookings" className="btn-outline px-4 py-2.5">
            Manage bookings
          </Link>
          <Link to="/admin/returns" className="btn-primary px-4 py-2.5">
            Inspect returns
          </Link>
        </div>
      </header>

      {/* ---------------- KPI cards ---------------- */}
      <section aria-label="Key performance indicators" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <p className="label-caps">{kpi.label}</p>
            <p className={`mt-2 font-display text-3xl ${kpi.accent}`}>{kpi.value}</p>
          </div>
        ))}
      </section>

      {/* ---------------- Charts ---------------- */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2" aria-label="Charts">
        <div className="card p-5">
          <h2 className="font-display text-xl text-ink">Bookings by status</h2>
          <div className="mt-4 h-72">
            {pieData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-ink/50">
                No bookings yet — charts will appear once bookings exist.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#C9A86A'} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-xl text-ink">Revenue over time</h2>
          <div className="mt-4 h-72">
            {revenueData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-ink/50">
                No paid bookings yet — revenue will appear here.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A86A" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#C9A86A" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8CFC3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#17171799' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#17171799' }} width={70} />
                  <Tooltip formatter={(value) => formatRWF(Number(value))} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#C9A86A"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- Quick stats ---------------- */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Quick stats">
        <div className="card p-5">
          <p className="label-caps">Pending approvals</p>
          <p className="mt-1 font-display text-2xl text-amber-600">{summary.pendingApprovals}</p>
          <Link to="/admin/bookings?status=PENDING" className="mt-2 inline-block text-xs font-semibold uppercase tracking-wider text-burgundy hover:underline">
            Review →
          </Link>
        </div>
        <div className="card p-5">
          <p className="label-caps">Awaiting return inspection</p>
          <p className="mt-1 font-display text-2xl text-blue-600">{summary.activeRentals}</p>
          <Link to="/admin/returns" className="mt-2 inline-block text-xs font-semibold uppercase tracking-wider text-burgundy hover:underline">
            Inspect →
          </Link>
        </div>
        <div className="card p-5">
          <p className="label-caps">Total bookings</p>
          <p className="mt-1 font-display text-2xl text-ink">{summary.totalBookings}</p>
          <Link to="/admin/reports" className="mt-2 inline-block text-xs font-semibold uppercase tracking-wider text-burgundy hover:underline">
            Full report →
          </Link>
        </div>
      </section>
    </div>
  )
}
