import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { ErrorState, LoadingState } from '../components/States'
import { outfitService } from '../services/outfitService'
import type { Outfit } from '../types'
import {
  CATEGORY_LABELS,
  addDaysISO,
  errorMessage,
  formatRentalPeriod,
  formatRWF,
  rentalPriceNote,
  todayISO,
} from '../utils/format'

export function OutfitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // The customer picks a START date only — the rental period is fixed by the
  // outfit (wedding wear → 5 days, everything else → 3 days) and the expected
  // return date is derived from it.
  const [startDate, setStartDate] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  /** Availability verdict for the rental period (null = not checked yet). */
  const [rangeCheck, setRangeCheck] = useState<{ available: boolean; note: string } | null>(null)
  const [checking, setChecking] = useState(false)

  const expectedReturn =
    outfit && startDate ? addDaysISO(startDate, outfit.rentalPeriodDays) : ''

  const load = useCallback(() => {
    const outfitId = Number(id)
    if (!Number.isFinite(outfitId)) {
      setError('Invalid outfit id.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    outfitService
      .get(outfitId)
      .then(setOutfit)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(load, [load])

  // Re-check availability whenever the start date changes (Rule 1 client-side view).
  useEffect(() => {
    if (!startDate || !expectedReturn) {
      setRangeCheck(null)
      setDateError(null)
      return
    }
    if (startDate < todayISO()) {
      setDateError('Start date cannot be in the past.')
      setRangeCheck(null)
      return
    }
    setDateError(null)

    let cancelled = false
    setChecking(true)
    outfitService
      .list({ startDate, endDate: expectedReturn })
      .then((list) => {
        if (cancelled) return
        const match = list.find((item) => item.id === Number(id))
        setRangeCheck(
          match
            ? { available: match.available, note: match.availabilityNote }
            : { available: false, note: 'This outfit is not in the available list for these dates.' },
        )
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [startDate, expectedReturn, id])

  if (loading) return <LoadingState label="Loading outfit" />
  if (error && !outfit) return <ErrorState message={error} onRetry={load} />
  if (!outfit) return <ErrorState message="Outfit not found." />

  // Fixed rental price for the whole period — never price × days.
  const rentalTotal = Number(outfit.rentalPrice)
  const deposit = Number(outfit.depositAmount)
  const amountDue = rentalTotal + deposit
  const datesValid = !!startDate && !dateError && !!expectedReturn
  const canBook = datesValid && rangeCheck?.available === true && outfit.status !== 'RETIRED'

  const handleBook = () => {
    if (!canBook) return
    navigate(`/checkout?outfitId=${outfit.id}&start=${startDate}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink/50">
        <Link to="/outfits" className="hover:text-burgundy">
          Collection
        </Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/outfits?category=${outfit.category}`} className="hover:text-burgundy">
          {CATEGORY_LABELS[outfit.category]}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{outfit.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ---------------- Gallery ---------------- */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <ImageWithFallback
              src={outfit.imageUrl}
              alt={outfit.name}
              label={outfit.name}
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-ink/50">
            <span>Size {outfit.size}</span>
            <span>{outfit.color}</span>
          </div>
        </div>

        {/* ---------------- Details ---------------- */}
        <div>
          <p className="label-caps text-gold-dark">{CATEGORY_LABELS[outfit.category]}</p>
          <h1 className="mt-2 text-4xl text-ink">{outfit.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                outfit.available
                  ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                  : 'border-taupe bg-taupe/40 text-ink/70'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${outfit.available ? 'bg-emerald-500' : 'bg-ink/40'}`}
                aria-hidden="true"
              />
              {outfit.availabilityNote}
            </span>
          </div>

          {outfit.description && (
            <p className="mt-5 leading-relaxed text-ink/70">{outfit.description}</p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-taupe py-5 text-sm">
            <div>
              <dt className="label-caps">Size</dt>
              <dd className="mt-1 font-medium text-ink">{outfit.size}</dd>
            </div>
            <div>
              <dt className="label-caps">Colour</dt>
              <dd className="mt-1 font-medium text-ink">{outfit.color}</dd>
            </div>
            <div>
              <dt className="label-caps">Rental price</dt>
              <dd className="mt-1 font-semibold text-ink">{formatRWF(outfit.rentalPrice)}</dd>
              <dd className="mt-1 text-xs text-ink/50">Fixed price for the whole rental period</dd>
            </div>
            <div>
              <dt className="label-caps">Rental period</dt>
              <dd className="mt-1 font-semibold text-ink">
                {formatRentalPeriod(outfit.rentalPeriodDays)}
              </dd>
              <dd className="mt-1 text-xs text-ink/50">Wedding outfits: 5 days · others: 3 days</dd>
            </div>
            <div>
              <dt className="label-caps">Refundable deposit</dt>
              <dd className="mt-1 font-semibold text-ink">{formatRWF(outfit.depositAmount)}</dd>
            </div>
            <div>
              <dt className="label-caps">Late fee</dt>
              <dd className="mt-1 font-medium text-ink">
                {formatRWF(outfit.lateFeePerDay)} per extra day
              </dd>
            </div>
          </dl>

          {/* ---------------- Start date picker ---------------- */}
          <section className="card mt-6 p-5" aria-labelledby="dates-heading">
            <h2 id="dates-heading" className="font-display text-xl text-ink">
              Choose your start date
            </h2>
            <p className="mt-1 text-xs text-ink/50">
              The rental period is fixed at {formatRentalPeriod(outfit.rentalPeriodDays)} for this
              outfit — we calculate your return date automatically.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rental-start" className="label-caps">
                  Rental start
                </label>
                <input
                  id="rental-start"
                  type="date"
                  min={todayISO()}
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="input-field mt-1.5"
                />
              </div>
              <div>
                <label htmlFor="rental-end" className="label-caps">
                  Expected return (calculated)
                </label>
                <input
                  id="rental-end"
                  type="date"
                  value={expectedReturn}
                  readOnly
                  disabled
                  className="input-field mt-1.5 cursor-not-allowed bg-taupe/30 text-ink/70"
                />
              </div>
            </div>

            {dateError && (
              <p role="alert" className="mt-3 text-sm text-burgundy">
                {dateError}
              </p>
            )}

            {datesValid && (
              <div className="mt-4 space-y-2 text-sm" aria-live="polite">
                <div className="flex justify-between text-ink/70">
                  <span>
                    Rental price · {formatRentalPeriod(outfit.rentalPeriodDays)} (
                    {startDate} → {expectedReturn})
                  </span>
                  <span className="font-medium text-ink">{formatRWF(rentalTotal)}</span>
                </div>
                <p className="text-xs text-ink/50">{rentalPriceNote()}</p>
                <div className="flex justify-between text-ink/70">
                  <span>Refundable deposit</span>
                  <span className="font-medium text-ink">{formatRWF(deposit)}</span>
                </div>
                <div className="flex justify-between border-t border-taupe pt-2.5 font-display text-lg text-ink">
                  <span>Amount due</span>
                  <span className="text-burgundy">{formatRWF(amountDue)}</span>
                </div>

                {checking && <p className="text-xs text-ink/50">Checking availability…</p>}
                {!checking && rangeCheck && (
                  <p
                    className={`text-sm font-medium ${rangeCheck.available ? 'text-emerald-700' : 'text-burgundy'}`}
                  >
                    {rangeCheck.available
                      ? 'Available for your entire rental period ✓'
                      : `Unavailable: ${rangeCheck.note}`}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleBook}
              disabled={!canBook}
              className="btn-gold mt-5 w-full"
            >
              Book this outfit
            </button>

            {!datesValid && (
              <p className="mt-2 text-center text-xs text-ink/50">
                Select your rental start date to continue.
              </p>
            )}
            {datesValid && !checking && !rangeCheck?.available && (
              <p className="mt-2 text-center text-xs text-burgundy">
                This outfit is already booked for the selected dates — try another start date.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
