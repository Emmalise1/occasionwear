import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Modal } from '../../components/Modal'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { StatusBadge } from '../../components/StatusBadge'
import { adminService } from '../../services/adminService'
import type { Booking, BookingStatus } from '../../types'
import { errorMessage, formatDate, formatRentalPeriod, formatRWF } from '../../utils/format'

const TABS: (BookingStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']

export function AdminBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('status') as BookingStatus | null) ?? 'ALL'

  const [tab, setTab] = useState<BookingStatus | 'ALL'>(
    TABS.includes(initialTab as BookingStatus) ? (initialTab as BookingStatus) : 'ALL',
  )
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(
    (status: BookingStatus | 'ALL') => {
      setLoading(true)
      setError(null)
      adminService
        .listBookings(status === 'ALL' ? undefined : status)
        .then(setBookings)
        .catch((err) => setError(errorMessage(err)))
        .finally(() => setLoading(false))
    },
    [],
  )

  useEffect(() => {
    load(tab)
  }, [tab, load])

  const changeTab = (next: BookingStatus | 'ALL') => {
    setTab(next)
    if (next === 'ALL') setSearchParams({})
    else setSearchParams({ status: next })
    setActionError(null)
  }

  const act = async (booking: Booking, kind: 'approve' | 'pickup') => {
    setBusyId(booking.id)
    setActionError(null)
    try {
      if (kind === 'approve') {
        await adminService.approve(booking.id)
        setNotice(`Booking ${booking.reference} approved — the customer has been notified.`)
      } else {
        await adminService.confirmPickup(booking.id)
        setNotice(`Pickup confirmed for ${booking.reference} — the outfit is now rented out.`)
      }
      setSelected(null)
      load(tab)
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold-dark">Operations</p>
          <h1 className="mt-2 text-3xl text-ink">Bookings</h1>
        </div>
        <p className="text-sm text-ink/60">{bookings.length} booking{bookings.length === 1 ? '' : 's'} shown</p>
      </header>

      {/* ---------------- Status filter tabs ---------------- */}
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter bookings by status">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => changeTab(value)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              tab === value
                ? 'border-ink bg-ink text-ivory'
                : 'border-taupe bg-white text-ink/60 hover:border-gold hover:text-ink'
            }`}
          >
            {value === 'ALL' ? 'All' : value.replace('_', ' ')}
          </button>
        ))}
      </div>

      {notice && (
        <div role="status" className="mt-5 flex items-start justify-between gap-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="mt-6" aria-live="polite">
        {loading && <LoadingState label="Loading bookings" />}
        {!loading && error && <ErrorState message={error} onRetry={() => load(tab)} />}
        {!loading && !error && bookings.length === 0 && (
          <EmptyState
            title={tab === 'ALL' ? 'No bookings yet' : `No ${tab.toLowerCase()} bookings`}
            message="Bookings appear here as customers reserve outfits from the storefront."
          />
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-taupe bg-taupe/25 text-[11px] uppercase tracking-[0.14em] text-ink/60">
                <tr>
                  <th scope="col" className="px-4 py-3">Reference</th>
                  <th scope="col" className="px-4 py-3">Customer</th>
                  <th scope="col" className="px-4 py-3">Outfit</th>
                  <th scope="col" className="px-4 py-3">Dates</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3">Payment</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-taupe">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="bg-white transition hover:bg-ivory">
                    <td className="px-4 py-3 font-semibold text-ink">{booking.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{booking.customer.name}</p>
                      <p className="text-xs text-ink/50">{booking.customer.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-ink">{booking.outfit.name}</td>
                    <td className="px-4 py-3 text-ink/70">
                      {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink">
                      {formatRWF(booking.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {booking.payment && <StatusBadge kind="payment" value={booking.payment.status} />}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="booking" value={booking.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {booking.status === 'PENDING' && (
                          <button
                            type="button"
                            className="rounded-md bg-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ivory transition hover:bg-burgundy disabled:opacity-50"
                            onClick={() => act(booking, 'approve')}
                            disabled={busyId === booking.id}
                          >
                            Approve
                          </button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            className="rounded-md bg-gold px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink transition hover:bg-gold-dark disabled:opacity-50"
                            onClick={() => act(booking, 'pickup')}
                            disabled={busyId === booking.id}
                          >
                            Confirm pickup
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-md border border-taupe px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink/70 transition hover:border-ink hover:text-ink"
                          onClick={() => {
                            setSelected(booking)
                            setActionError(null)
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- Details drawer ---------------- */}
      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Booking details" wide>
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-2xl text-ink">{selected.reference}</span>
              <StatusBadge kind="booking" value={selected.status} />
              {selected.payment && <StatusBadge kind="payment" value={selected.payment.status} />}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <section className="rounded-md border border-taupe bg-white p-4">
                <h3 className="label-caps">Customer</h3>
                <p className="mt-2 font-medium text-ink">{selected.customer.name}</p>
                <p className="text-ink/60">{selected.customer.email}</p>
                <p className="text-ink/60">{selected.customer.phone}</p>
                {selected.customer.address && <p className="text-ink/60">{selected.customer.address}</p>}
              </section>

              <section className="rounded-md border border-taupe bg-white p-4">
                <h3 className="label-caps">Outfit</h3>
                <p className="mt-2 font-medium text-ink">{selected.outfit.name}</p>
                <p className="text-ink/60">
                  {selected.outfit.category.replace('_', ' ')} · Size {selected.outfit.size} ·{' '}
                  {selected.outfit.color}
                </p>
                <p className="text-ink/60">
                  Rental price {formatRWF(selected.outfit.rentalPrice)} for{' '}
                  {formatRentalPeriod(selected.outfit.rentalPeriodDays)}
                  {' · '}Refundable deposit {formatRWF(selected.outfit.depositAmount)}
                </p>
              </section>

              <section className="rounded-md border border-taupe bg-white p-4">
                <h3 className="label-caps">Rental</h3>
                <p className="mt-2 text-ink/70">
                  {formatDate(selected.startDate)} → {formatDate(selected.endDate)}
                </p>
                <p className="mt-1 text-ink/50">Created {formatDate(selected.createdAt.slice(0, 10))}</p>
              </section>

              <section className="rounded-md border border-taupe bg-white p-4">
                <h3 className="label-caps">Payment</h3>
                {selected.payment ? (
                  <dl className="mt-2 space-y-1 text-ink/70">
                    <div className="flex justify-between">
                      <dt>Rental</dt>
                      <dd>{formatRWF(selected.payment.amount)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Deposit</dt>
                      <dd>{formatRWF(selected.payment.deposit)}</dd>
                    </div>
                    <div className="flex justify-between text-burgundy">
                      <dt>Late fee</dt>
                      <dd>{formatRWF(selected.payment.lateFee)}</dd>
                    </div>
                    <div className="flex justify-between text-burgundy">
                      <dt>Damage fee</dt>
                      <dd>{formatRWF(selected.payment.damageFee)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-taupe pt-1 font-semibold text-ink">
                      <dt>Amount due</dt>
                      <dd>{formatRWF(selected.payment.amountDue)}</dd>
                    </div>
                    <p className="pt-1 text-xs text-ink/50">
                      Method: {selected.payment.method ?? '—'} · Status: {selected.payment.status}
                    </p>
                  </dl>
                ) : (
                  <p className="mt-2 text-ink/50">No payment record.</p>
                )}
              </section>
            </div>

            {selected.delivery && (
              <section className="rounded-md border border-taupe bg-white p-4">
                <h3 className="label-caps">Delivery</h3>
                <p className="mt-1 text-ink/70">
                  {selected.delivery.address} · {selected.delivery.status}
                  {selected.delivery.deliveryDate
                    ? ` · ${formatDate(selected.delivery.deliveryDate)}`
                    : ''}
                </p>
              </section>
            )}

            {actionError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
                {actionError}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-outline px-4 py-2" onClick={() => setSelected(null)}>
                Close
              </button>
              {selected.status === 'PENDING' && (
                <button
                  type="button"
                  className="btn-primary px-4 py-2"
                  onClick={() => act(selected, 'approve')}
                  disabled={busyId === selected.id}
                >
                  {busyId === selected.id ? 'Working…' : 'Approve booking'}
                </button>
              )}
              {selected.status === 'CONFIRMED' && (
                <button
                  type="button"
                  className="btn-gold px-4 py-2"
                  onClick={() => act(selected, 'pickup')}
                  disabled={busyId === selected.id}
                >
                  {busyId === selected.id ? 'Working…' : 'Confirm pickup'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
