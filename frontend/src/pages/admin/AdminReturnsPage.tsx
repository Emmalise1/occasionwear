import { useCallback, useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { StatusBadge } from '../../components/StatusBadge'
import { adminService } from '../../services/adminService'
import type { ReturnCondition, ReturnItem } from '../../types'
import { errorMessage, formatDate, formatRWF, todayISO } from '../../utils/format'

const CONDITIONS: { value: ReturnCondition; label: string; hint: string }[] = [
  {
    value: 'GOOD_ON_TIME',
    label: 'Good on time',
    hint: 'Returned on/before the expected return date in perfect condition — no fee.',
  },
  {
    value: 'LATE',
    label: 'Late',
    hint: 'Returned after the rental period — 2,000 RWF for each extra day.',
  },
  {
    value: 'DAMAGED',
    label: 'Damaged',
    hint: 'Returned with damage — damage fee applies (plus any chargeable late days). Outfit goes for repair.',
  },
]

export function AdminReturnsPage() {
  const [items, setItems] = useState<ReturnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ReturnItem | null>(null)
  const [condition, setCondition] = useState<ReturnCondition>('GOOD_ON_TIME')
  const [damageFee, setDamageFee] = useState('')
  const [feeError, setFeeError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminService
      .returnsAwaiting()
      .then(setItems)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const openInspection = (item: ReturnItem) => {
    setSelected(item)
    setCondition('GOOD_ON_TIME')
    setDamageFee('')
    setFeeError(null)
  }

  const submitInspection = async () => {
    if (!selected) return
    if (condition === 'DAMAGED') {
      const amount = Number(damageFee)
      if (!damageFee || Number.isNaN(amount) || amount <= 0) {
        setFeeError('A positive damage fee is required for a DAMAGED inspection.')
        return
      }
    }
    setFeeError(null)
    setBusy(true)
    try {
      await adminService.inspect(
        selected.booking.id,
        condition,
        condition === 'DAMAGED' ? Number(damageFee) : undefined,
      )
      setNotice(
        `Inspection recorded for ${selected.booking.reference}: ${condition.replace('_', ' ')}.`,
      )
      setSelected(null)
      load()
    } catch (err) {
      setFeeError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold-dark">Returns &amp; inspection</p>
          <h1 className="mt-2 text-3xl text-ink">Awaiting return</h1>
        </div>
        <p className="text-sm text-ink/60">
          {items.length} active rental{items.length === 1 ? '' : 's'}
        </p>
      </header>

      {/* Policy reminder for staff */}
      <section className="mt-5 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm text-ink/70">
        <p>
          <strong className="text-ink">Late-return policy:</strong> every outfit has a fixed rental
          period — <strong className="text-ink">5 days for wedding wear</strong>,{' '}
          <strong className="text-ink">3 days for everything else</strong>. On-time returns are
          free. Beyond the expected return date,{' '}
          <strong className="text-ink">{formatRWF(items[0]?.lateFeePerDay ?? 2000)} per extra day</strong>{' '}
          applies, and the outfit stays overdue (unavailable to others) until it is inspected.
          Damage charges are separate.
        </p>
      </section>

      {notice && (
        <div role="status" className="mt-5 flex items-start justify-between gap-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="mt-6 space-y-4" aria-live="polite">
        {loading && <LoadingState label="Loading returns" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="No returns awaiting inspection"
            message="Active rentals appear here so you can inspect them and apply late or damage fees when needed."
          />
        )}

        {!loading &&
          !error &&
          items.map((item) => {
            const booking = item.booking
            const feeApplies = item.chargeableLateDays > 0

            return (
              <article key={booking.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="label-caps text-gold-dark">{booking.reference}</p>
                    <h2 className="mt-1 font-display text-xl text-ink">{booking.outfit.name}</h2>
                    <p className="mt-1 text-sm text-ink/60">
                      {booking.customer.name} · {booking.customer.phone}
                    </p>
                    <p className="mt-2 text-sm text-ink/70">
                      Rental: {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      <span className="mx-2 text-taupe">|</span>
                      Expected return: <strong>{formatDate(item.expectedReturn)}</strong>
                    </p>
                    {booking.returnDate && (
                      <p className="mt-1 text-sm text-ink/70">
                        Customer reported return: <strong>{formatDate(booking.returnDate)}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge kind="booking" value={booking.status} />
                    <span className="rounded-full border border-taupe bg-taupe/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink/70">
                      Period: {item.rentalPeriodDays} days
                    </span>
                    {item.overdueDays > 0 && (
                      <span className="rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-700">
                        {item.overdueDays} day{item.overdueDays > 1 ? 's' : ''} overdue
                      </span>
                    )}
                    <span className="text-xs font-semibold text-burgundy">
                      {feeApplies
                        ? `Late fee preview: ${formatRWF(item.lateFeePreview)} (${item.chargeableLateDays} chargeable day${item.chargeableLateDays > 1 ? 's' : ''})`
                        : 'Late fee preview: 0 RWF'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button type="button" className="btn-gold px-5 py-2.5" onClick={() => openInspection(item)}>
                    Inspect return
                  </button>
                </div>
              </article>
            )
          })}
      </div>

      {/* ---------------- Inspection modal ---------------- */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={`Inspect return · ${selected?.booking.reference ?? ''}`}
      >
        {selected && (
          <InspectionForm
            item={selected}
            condition={condition}
            setCondition={setCondition}
            damageFee={damageFee}
            setDamageFee={setDamageFee}
            feeError={feeError}
            busy={busy}
            onCancel={() => setSelected(null)}
            onSubmit={submitInspection}
          />
        )}
      </Modal>
    </div>
  )
}

function InspectionForm({
  item,
  condition,
  setCondition,
  damageFee,
  setDamageFee,
  feeError,
  busy,
  onCancel,
  onSubmit,
}: {
  item: ReturnItem
  condition: ReturnCondition
  setCondition: (c: ReturnCondition) => void
  damageFee: string
  setDamageFee: (v: string) => void
  feeError: string | null
  busy: boolean
  onCancel: () => void
  onSubmit: () => void
}) {
  const booking = item.booking
  const actualReturn = booking.returnDate ?? todayISO()
  const latePreview = item.lateFeePreview
  const damageAmount = Number(damageFee || 0)
  const showLateLine = item.chargeableLateDays > 0
  const damageTotal = latePreview + (condition === 'DAMAGED' && damageAmount > 0 ? damageAmount : 0)

  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-md border border-taupe bg-white p-4">
        <p className="font-medium text-ink">{booking.outfit.name}</p>
        <p className="mt-0.5 text-ink/60">
          {booking.customer.name} · {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
        </p>
      </div>

      <fieldset>
        <legend className="label-caps">Condition</legend>
        <div className="mt-2 space-y-2">
          {CONDITIONS.map((entry) => (
            <label
              key={entry.value}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                condition === entry.value
                  ? 'border-gold bg-gold/10 ring-2 ring-gold/40'
                  : 'border-taupe bg-white hover:border-gold/50'
              }`}
            >
              <input
                type="radio"
                name="condition"
                value={entry.value}
                checked={condition === entry.value}
                onChange={() => setCondition(entry.value)}
                className="mt-1 h-4 w-4 accent-burgundy"
              />
              <span>
                <span className="block font-semibold text-ink">{entry.label}</span>
                <span className="block text-xs text-ink/60">{entry.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {condition === 'DAMAGED' && (
        <div>
          <label htmlFor="damage-fee" className="label-caps">
            Damage fee (RWF)
          </label>
          <input
            id="damage-fee"
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 50000"
            value={damageFee}
            onChange={(event) => setDamageFee(event.target.value)}
            className="input-field mt-1.5"
          />
        </div>
      )}

      {/* Fee preview — full breakdown, calculated by the backend */}
      <div className="rounded-md border border-gold/40 bg-gold/10 p-4" aria-live="polite">
        <p className="label-caps text-gold-dark">Fee preview</p>

        <dl className="mt-2 space-y-1 text-sm text-ink/80">
          <div className="flex justify-between gap-4">
            <dt>Original return date</dt>
            <dd className="font-medium text-ink">{formatDate(item.expectedReturn)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Actual return date</dt>
            <dd className="font-medium text-ink">{formatDate(actualReturn)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Rental period</dt>
            <dd className="font-medium text-ink">{item.rentalPeriodDays} days</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Days overdue</dt>
            <dd className="font-medium text-ink">{item.overdueDays}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Chargeable late days</dt>
            <dd className="font-medium text-ink">{item.chargeableLateDays}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-gold/40 pt-1.5">
            <dt>Late fee ({formatRWF(item.lateFeePerDay)} × {item.chargeableLateDays} extra day{item.chargeableLateDays === 1 ? '' : 's'})</dt>
            <dd className="font-semibold text-burgundy">{formatRWF(latePreview)}</dd>
          </div>
          {condition === 'DAMAGED' && (
            <div className="flex justify-between gap-4">
              <dt>Damage fee</dt>
              <dd className="font-semibold text-burgundy">
                {damageAmount > 0 ? formatRWF(damageAmount) : '—'}
              </dd>
            </div>
          )}
        </dl>

        <p className="mt-2 text-xs text-ink/60">
          {item.overdueDays === 0
            ? 'Returned on or before the expected return date — no late fee.'
            : `Returned ${item.overdueDays} day${item.overdueDays > 1 ? 's' : ''} after the expected return date — ${formatRWF(item.lateFeePerDay)} per extra day gives ${formatRWF(latePreview)}.`}
        </p>

        {condition === 'DAMAGED' && damageAmount > 0 && (
          <p className="mt-2 border-t border-gold/40 pt-2 font-display text-lg text-ink">
            Total fees: {formatRWF(damageTotal)}
            {showLateLine && damageTotal > latePreview ? ' (late + damage)' : ''}
          </p>
        )}
      </div>

      {feeError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
          {feeError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-outline px-4 py-2" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn-primary px-4 py-2" onClick={onSubmit} disabled={busy}>
          {busy ? 'Recording…' : 'Confirm inspection'}
        </button>
      </div>
    </div>
  )
}
