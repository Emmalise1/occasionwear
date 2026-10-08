import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { Modal } from '../components/Modal'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { StatusBadge } from '../components/StatusBadge'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { bookingService } from '../services/bookingService'
import type { Booking } from '../types'
import {
  errorMessage,
  formatDate,
  formatRWF,
} from '../utils/format'

type PendingAction = { kind: 'cancel' | 'return'; booking: Booking } | null

export function MyBookingsPage() {
  useDocumentTitle('My bookings')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<PendingAction>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    bookingService
      .myBookings()
      .then(setBookings)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const confirmAction = async () => {
    if (!action) return
    setBusy(true)
    setActionError(null)
    try {
      if (action.kind === 'cancel') {
        await bookingService.cancel(action.booking.id)
        setNotice(`Booking ${action.booking.reference} cancelled — the outfit is available again.`)
      } else {
        await bookingService.requestReturn(action.booking.id)
        setNotice(
          `Return reported for ${action.booking.reference}. The admin team will inspect the outfit.`,
        )
      }
      setAction(null)
      load()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingState label="Loading your bookings" />
  if (error) return <div className="mx-auto max-w-5xl px-4 py-16"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold-dark">Your rentals</p>
          <h1 className="mt-2 text-4xl text-ink">My bookings</h1>
        </div>
        <Link to="/outfits" className="btn-outline px-4 py-2.5">
          Browse collection
        </Link>
      </header>

      {notice && (
        <div
          role="status"
          className="mt-6 flex items-start justify-between gap-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">
            ✕
          </button>
        </div>
      )}

      {/* Return policy — fixed rental periods + late fee rule */}
      <section className="mt-6 rounded-lg border border-gold/40 bg-gold/10 p-5" aria-labelledby="return-policy">
        <h2 id="return-policy" className="font-display text-lg text-ink">
          Return policy
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
          Every outfit is rented for a fixed period:{' '}
          <strong className="text-ink">wedding outfits 5 days</strong> and{' '}
          <strong className="text-ink">all other outfits 3 days</strong>, for one fixed rental
          price. Return by your expected return date — on-time returns are never charged extra.
          Each extra day costs <strong className="text-ink">2,000 RWF</strong>, damage charges are
          separate, and the refundable deposit is returned after inspection.
        </p>
      </section>

      <div className="mt-8 space-y-5" aria-live="polite">
        {bookings.length === 0 && (
          <EmptyState
            title="No bookings yet"
            message="When you reserve an outfit, it will appear here with its status and payment details."
            action={
              <Link to="/outfits" className="btn-gold">
                Explore the collection
              </Link>
            }
          />
        )}

        {bookings.map((booking) => {
          const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED'
          const canReturn = booking.status === 'ACTIVE'

          return (
            <article key={booking.id} className="card overflow-hidden">
              <div className="grid gap-5 p-5 sm:grid-cols-[110px_1fr]">
                <ImageWithFallback
                  src={booking.outfit.imageUrl}
                  alt={booking.outfit.name}
                  label={booking.outfit.name}
                  className="h-40 w-full rounded-md object-cover sm:h-[140px] sm:w-[110px]"
                />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="label-caps text-gold-dark">{booking.reference}</p>
                      <h2 className="mt-1 font-display text-xl text-ink">{booking.outfit.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge kind="booking" value={booking.status} />
                      {booking.payment && <StatusBadge kind="payment" value={booking.payment.status} />}
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="label-caps">Dates</dt>
                      <dd className="mt-0.5 text-ink">
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="label-caps">Total amount</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{formatRWF(booking.totalAmount)}</dd>
                    </div>
                    <div>
                      <dt className="label-caps">Refundable deposit</dt>
                      <dd className="mt-0.5 text-ink">{formatRWF(booking.payment?.deposit ?? 0)}</dd>
                    </div>
                    <div>
                      <dt className="label-caps">Payment</dt>
                      <dd className="mt-0.5 text-ink">
                        {booking.payment ? formatRWF(booking.payment.amountDue) : '—'}
                      </dd>
                    </div>
                  </dl>

                  {(canCancel || canReturn) && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {canCancel && (
                        <button
                          type="button"
                          className="btn-outline px-4 py-2"
                          onClick={() => {
                            setAction({ kind: 'cancel', booking })
                            setActionError(null)
                          }}
                        >
                          Cancel booking
                        </button>
                      )}
                      {canReturn && (
                        <button
                          type="button"
                          className="btn-gold px-4 py-2"
                          onClick={() => {
                            setAction({ kind: 'return', booking })
                            setActionError(null)
                          }}
                        >
                          Report return
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <Modal
        open={action !== null}
        onClose={() => setAction(null)}
        title={action?.kind === 'cancel' ? 'Cancel this booking?' : 'Report this return?'}
      >
        {action && (
          <div className="space-y-4 text-sm text-ink/70">
            {action.kind === 'cancel' ? (
              <p>
                Booking <strong className="text-ink">{action.booking.reference}</strong> for{' '}
                <strong className="text-ink">{action.booking.outfit.name}</strong> (
                {formatDate(action.booking.startDate)} → {formatDate(action.booking.endDate)}) will be
                cancelled{action.booking.payment?.status === 'PAID' ? ' and your payment refunded' : ''}
                . The outfit is released back to the collection.
              </p>
            ) : (
              <p>
                Confirm that you have returned{' '}
                <strong className="text-ink">{action.booking.outfit.name}</strong> for booking{' '}
                <strong className="text-ink">{action.booking.reference}</strong>. Our team will
                inspect the outfit and notify you of the result.
              </p>
            )}

            {actionError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
                {actionError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-outline px-4 py-2" onClick={() => setAction(null)}>
                Keep booking
              </button>
              <button
                type="button"
                className="btn-primary px-4 py-2"
                onClick={confirmAction}
                disabled={busy}
              >
                {busy ? 'Working…' : action.kind === 'cancel' ? 'Yes, cancel it' : 'Confirm return'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
