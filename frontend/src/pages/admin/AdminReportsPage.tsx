import { useCallback, useEffect, useState } from 'react'
import { ErrorState, LoadingState } from '../../components/States'
import { adminService } from '../../services/adminService'
import type { ReportSummary } from '../../types'
import { errorMessage, formatRWF } from '../../utils/format'

export function AdminReportsPage() {
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

  if (loading) return <LoadingState label="Loading reports" />
  if (error || !summary) return <ErrorState message={error ?? 'No data available.'} onRetry={load} />

  const maxBookingCount = Math.max(1, ...Object.values(summary.bookingsByStatus))
  const maxOutfitCount = Math.max(1, ...Object.values(summary.outfitsByStatus))

  return (
    <div>
      <header>
        <p className="label-caps text-gold-dark">Analytics</p>
        <h1 className="mt-2 text-3xl text-ink">Reports</h1>
        <p className="mt-2 text-sm text-ink/60">
          Served by <code className="rounded bg-taupe/40 px-1.5 py-0.5 text-xs">GET /api/admin/reports/summary</code>
        </p>
      </header>

      {/* ---------------- Headline numbers ---------------- */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Headline figures">
        <Figure label="Total bookings" value={String(summary.totalBookings)} />
        <Figure label="Total revenue" value={formatRWF(summary.totalRevenue)} accent />
        <Figure label="Active rentals" value={String(summary.activeRentals)} />
        <Figure label="Damaged outfits" value={String(summary.damagedOutfits)} />
        <Figure label="Available outfits" value={String(summary.availableOutfits)} />
        <Figure label="Rented out outfits" value={String(summary.rentedOutfits)} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ---------------- Bookings by status ---------------- */}
        <section className="card p-6" aria-labelledby="rep-bookings">
          <h2 id="rep-bookings" className="font-display text-xl text-ink">
            Bookings by status
          </h2>
          <ul className="mt-5 space-y-3">
            {Object.entries(summary.bookingsByStatus).map(([name, count]) => (
              <li key={name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{name.replace('_', ' ')}</span>
                  <span className="text-ink/60">{count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-taupe/50">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${(count / maxBookingCount) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- Outfits by status ---------------- */}
        <section className="card p-6" aria-labelledby="rep-outfits">
          <h2 id="rep-outfits" className="font-display text-xl text-ink">
            Outfits by status
          </h2>
          <ul className="mt-5 space-y-3">
            {Object.entries(summary.outfitsByStatus).map(([name, count]) => (
              <li key={name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{name.replace('_', ' ')}</span>
                  <span className="text-ink/60">{count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-taupe/50">
                  <div
                    className="h-full rounded-full bg-burgundy transition-all"
                    style={{ width: `${(count / maxOutfitCount) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ---------------- Revenue over time ---------------- */}
      <section className="card mt-6 p-6" aria-labelledby="rep-revenue">
        <h2 id="rep-revenue" className="font-display text-xl text-ink">
          Revenue over time
        </h2>
        {summary.revenueOverTime.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No paid bookings yet.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-b border-taupe text-[11px] uppercase tracking-[0.14em] text-ink/60">
              <tr>
                <th scope="col" className="py-2">Date</th>
                <th scope="col" className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taupe/70">
              {summary.revenueOverTime.map((entry) => (
                <tr key={entry.date}>
                  <td className="py-2.5 text-ink/70">{entry.date}</td>
                  <td className="py-2.5 text-right font-medium text-ink">{formatRWF(entry.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function Figure({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-5">
      <p className="label-caps">{label}</p>
      <p className={`mt-2 font-display text-3xl ${accent ? 'text-burgundy' : 'text-ink'}`}>{value}</p>
    </div>
  )
}
