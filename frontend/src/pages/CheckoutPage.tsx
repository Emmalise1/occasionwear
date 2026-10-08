import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { ErrorState, LoadingState } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { bookingService } from '../services/bookingService'
import { outfitService } from '../services/outfitService'
import type { Booking, Outfit, PaymentMethod } from '../types'
import {
  addDaysISO,
  errorMessage,
  formatDate,
  formatRentalPeriod,
  formatRWF,
  rentalPriceNote,
  todayISO,
} from '../utils/format'

type Step = 1 | 2 | 3 | 4

const METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: 'MOBILE_MONEY', label: 'Mobile Money', hint: 'MTN MoMo · Airtel Money' },
  { value: 'CARD', label: 'Card', hint: 'Visa · Mastercard' },
  { value: 'CASH', label: 'Cash', hint: 'Pay at pickup in Kigali' },
]

export function CheckoutPage() {
  useDocumentTitle('Checkout')
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const outfitId = Number(searchParams.get('outfitId'))
  const initialStart = searchParams.get('start') ?? ''

  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<Step>(1)
  const [startDate, setStartDate] = useState(initialStart)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState(false)

  const [method, setMethod] = useState<PaymentMethod>('MOBILE_MONEY')
  const [phone, setPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(outfitId) || outfitId <= 0) {
      setError('No outfit selected. Pick an outfit first.')
      setLoading(false)
      return
    }
    outfitService
      .get(outfitId)
      .then(setOutfit)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [outfitId])

  // The rental period is fixed by the outfit (wedding wear → 5 days, all other
  // outfits → 3 days), so the expected return date is derived — never picked.
  const rentalPeriodDays = outfit?.rentalPeriodDays ?? 0
  const endDate = startDate && outfit ? addDaysISO(startDate, outfit.rentalPeriodDays) : ''
  // Fixed rental price for the whole period — never price × days.
  const rentalTotal = outfit ? Number(outfit.rentalPrice) : 0
  const deposit = outfit ? Number(outfit.depositAmount) : 0
  const amountDue = rentalTotal + deposit

  const datesValid =
    !!outfit && !!endDate && startDate >= todayISO()

  const createBooking = async () => {
    if (!outfit || !datesValid) return
    setCreating(true)
    setError(null)
    try {
      // Only the start date is sent — the server derives the fixed rental
      // period and expected return date itself.
      const created = await bookingService.create({
        outfitId: outfit.id,
        startDate,
      })
      setBooking(created)
      setStep(3)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const pay = async () => {
    if (!booking) return
    if (method === 'MOBILE_MONEY' && phone.trim().length < 9) {
      setPaymentError('Enter a valid mobile money number (at least 9 digits).')
      return
    }
    if (method === 'CARD' && (cardNumber.replace(/\s/g, '').length < 12 || cardCvc.length < 3)) {
      setPaymentError('Enter valid card details.')
      return
    }
    setPaymentError(null)
    setPaying(true)
    try {
      const result = await bookingService.pay(booking.id, method, simulateFailure)
      setBooking(result)
      if (result.status === 'CANCELLED') {
        setFailed(true)
      } else {
        setStep(4)
      }
    } catch (err) {
      setPaymentError(errorMessage(err))
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <LoadingState label="Preparing checkout" />
  if (error && !booking && step < 4) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState
          message={error}
          title={outfit ? 'Checkout error' : 'No outfit selected'}
          onRetry={outfit ? () => { setError(null); setStep(1) } : undefined}
        />
        <div className="text-center">
          <Link to="/outfits" className="btn-outline">
            Browse the collection
          </Link>
        </div>
      </div>
    )
  }
  if (!outfit) return null

  // ---------------- Failed payment (Rule 4) ----------------
  if (failed && booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
          </span>
          <h1 className="mt-4 font-display text-3xl text-ink">Payment failed</h1>
          <p className="mt-3 text-sm text-ink/60">
            Your payment could not be processed. Booking{' '}
            <strong>{booking.reference}</strong> has been cancelled and{' '}
            <strong>{outfit.name}</strong> was released back to the collection.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="btn-gold"
              onClick={() => {
                setFailed(false)
                setBooking(null)
                setStep(1)
              }}
            >
              Try booking again
            </button>
            <Link to="/outfits" className="btn-outline">
              Browse collection
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---------------- Confirmation (Step 4) ----------------
  if (step === 4 && booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="card overflow-hidden text-center">
          <div className="bg-emerald-600 py-8 text-ivory">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ivory/60" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h1 className="mt-4 font-display text-3xl uppercase tracking-wide">Booking confirmed</h1>
            <p className="mt-1 text-sm text-ivory/80">A confirmation was sent by email and SMS.</p>
          </div>

          <dl className="divide-y divide-taupe px-8 text-left text-sm">
            <Row label="Booking reference" value={booking.reference} />
            <Row label="Outfit" value={outfit.name} />
            <Row label="Rental dates" value={`${formatDate(booking.startDate)} → ${formatDate(booking.endDate)}`} />
            <Row label="Amount paid" value={formatRWF(booking.payment?.amountDue ?? booking.totalAmount)} />
            <Row label="Security deposit" value={formatRWF(booking.payment?.deposit ?? deposit)} />
            <Row label="Booking status" value={booking.status} />
            <Row label="Payment status" value={booking.payment?.status ?? '—'} />
          </dl>

          <div className="flex flex-wrap justify-center gap-3 px-8 pb-8 pt-6">
            <Link to="/my-bookings" className="btn-primary">
              View my bookings
            </Link>
            <Link to="/outfits" className="btn-outline">
              Continue browsing
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const stepBadge = (n: Step, label: string) => (
    <li
      className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] ${
        step >= n ? 'text-ink' : 'text-ink/35'
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
          step >= n ? 'border-gold bg-gold text-ink' : 'border-taupe text-ink/40'
        }`}
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </li>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl text-ink">Checkout</h1>

      <ol className="mt-6 flex gap-5 border-b border-taupe pb-4" aria-label="Checkout steps">
        {stepBadge(1, 'Dates')}
        {stepBadge(2, 'Price summary')}
        {stepBadge(3, 'Payment')}
        {stepBadge(4, 'Confirmation')}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {step === 1 && (
            <section className="card p-6" aria-labelledby="step-dates">
              <h2 id="step-dates" className="font-display text-xl text-ink">
                1 · Your rental dates
              </h2>
              <p className="mt-1 text-xs text-ink/50">
                The rental period for this outfit is fixed at{' '}
                {formatRentalPeriod(rentalPeriodDays)} — pick your start date and we calculate the
                return date.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="co-start" className="label-caps">
                    Rental start
                  </label>
                  <input
                    id="co-start"
                    type="date"
                    min={todayISO()}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field mt-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="co-end" className="label-caps">
                    Expected return (calculated)
                  </label>
                  <input
                    id="co-end"
                    type="date"
                    value={endDate}
                    readOnly
                    disabled
                    className="input-field mt-1.5 cursor-not-allowed bg-taupe/30 text-ink/70"
                  />
                </div>
              </div>
              {startDate && startDate < todayISO() && (
                <p role="alert" className="mt-3 text-sm text-burgundy">
                  Start date cannot be in the past.
                </p>
              )}
              <div className="mt-6 flex justify-between">
                <Link to={`/outfits/${outfit.id}`} className="btn-outline px-4 py-2.5">
                  ← Back to outfit
                </Link>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!datesValid}
                  onClick={() => setStep(2)}
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="card p-6" aria-labelledby="step-price">
              <h2 id="step-price" className="font-display text-xl text-ink">
                2 · Price summary
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow label="Outfit" value={outfit.name} />
                <SummaryRow
                  label="Rental period"
                  value={`${formatDate(startDate)} → ${formatDate(endDate)} (${formatRentalPeriod(rentalPeriodDays)})`}
                />
                <SummaryRow
                  label={`Rental price (${formatRentalPeriod(rentalPeriodDays)})`}
                  value={formatRWF(rentalTotal)}
                />
                <SummaryRow label="Refundable deposit" value={formatRWF(deposit)} />
                <div className="flex items-center justify-between border-t border-taupe pt-3 font-display text-lg">
                  <dt className="text-ink">Amount due</dt>
                  <dd className="text-burgundy">{formatRWF(amountDue)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ink/50">
                {rentalPriceNote()}
              </p>
              <p className="mt-1 text-xs text-ink/50">
                The customer pays the fixed rental price once for the whole period, plus the
                refundable deposit. Late or damage fees may be added at inspection.
              </p>

              {error && (
                <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-between">
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>
                  ← Edit dates
                </button>
                <button type="button" className="btn-gold" onClick={createBooking} disabled={creating}>
                  {creating ? 'Reserving…' : 'Reserve & continue to payment'}
                </button>
              </div>
            </section>
          )}

          {step === 3 && booking && (
            <section className="card p-6" aria-labelledby="step-payment">
              <h2 id="step-payment" className="font-display text-xl text-ink">
                3 · Payment
              </h2>
              <p className="mt-1 text-xs text-ink/50">
                Mock checkout — no real payment provider is connected. Booking {booking.reference}.
              </p>

              <fieldset className="mt-5">
                <legend className="label-caps">Payment method</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {METHODS.map((entry) => (
                    <label
                      key={entry.value}
                      className={`cursor-pointer rounded-md border p-3 transition ${
                        method === entry.value
                          ? 'border-gold bg-gold/10 ring-2 ring-gold/40'
                          : 'border-taupe bg-white hover:border-gold/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={entry.value}
                        checked={method === entry.value}
                        onChange={() => setMethod(entry.value)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-semibold text-ink">{entry.label}</span>
                      <span className="mt-0.5 block text-xs text-ink/50">{entry.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-5">
                {method === 'MOBILE_MONEY' && (
                  <div>
                    <label htmlFor="mm-phone" className="label-caps">
                      Mobile money number
                    </label>
                    <input
                      id="mm-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="+250 7.. ... ..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field mt-1.5"
                    />
                  </div>
                )}

                {method === 'CARD' && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-3">
                      <label htmlFor="card-no" className="label-caps">
                        Card number
                      </label>
                      <input
                        id="card-no"
                        inputMode="numeric"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="input-field mt-1.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="card-exp" className="label-caps">
                        Expiry
                      </label>
                      <input
                        id="card-exp"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="input-field mt-1.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="card-cvc" className="label-caps">
                        CVC
                      </label>
                      <input
                        id="card-cvc"
                        inputMode="numeric"
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="input-field mt-1.5"
                      />
                    </div>
                  </div>
                )}

                {method === 'CASH' && (
                  <p className="rounded-md border border-taupe bg-taupe/30 p-3 text-sm text-ink/70">
                    Pay in cash at pickup. The booking is confirmed immediately for this demo.
                  </p>
                )}
              </div>

              <label className="mt-5 flex items-start gap-2.5 text-sm text-ink/60">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-burgundy"
                />
                <span>
                  Simulate a failed payment (demo) — shows the cancellation + release rules.
                </span>
              </label>

              {paymentError && (
                <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {paymentError}
                </p>
              )}

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setPaymentError(null)
                    setStep(2)
                  }}
                >
                  ← Back
                </button>
                <button type="button" className="btn-gold" onClick={pay} disabled={paying}>
                  {paying
                    ? 'Processing…'
                    : `Pay ${formatRWF(amountDue)}`}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* ---------------- Sidebar summary ---------------- */}
        <aside className="card h-fit overflow-hidden" aria-label="Order summary">
          <div className="flex gap-4 border-b border-taupe p-4">
            <ImageWithFallback
              src={outfit.imageUrl}
              alt={outfit.name}
              label={outfit.name}
              className="h-24 w-20 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="label-caps text-gold-dark">Your outfit</p>
              <p className="truncate font-display text-lg text-ink">{outfit.name}</p>
              <p className="mt-0.5 text-xs text-ink/50">
                Size {outfit.size} · {outfit.color}
              </p>
            </div>
          </div>
          <dl className="space-y-2 p-4 text-sm">
            <SummaryRow label="Dates" value={`${formatDate(startDate)} → ${formatDate(endDate)}`} />
            <SummaryRow label="Rental period" value={formatRentalPeriod(rentalPeriodDays)} />
            <SummaryRow label="Rental price" value={formatRWF(rentalTotal)} />
            <SummaryRow label="Deposit" value={formatRWF(deposit)} />
            <div className="flex justify-between border-t border-taupe pt-2 font-semibold">
              <dt className="text-ink">Amount due</dt>
              <dd className="text-burgundy">{formatRWF(amountDue)}</dd>
            </div>
          </dl>
          <p className="border-t border-taupe bg-taupe/20 p-4 text-xs text-ink/60">
            Signed in as {user?.name} · {user?.email}
          </p>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-ink/50">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink/60">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  )
}
