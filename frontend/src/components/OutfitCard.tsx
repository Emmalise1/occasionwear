import { Link } from 'react-router-dom'
import type { Outfit } from '../types'
import { CATEGORY_LABELS, formatRentalPeriod, formatRWF } from '../utils/format'
import { ImageWithFallback } from './ImageWithFallback'

export function OutfitCard({ outfit }: { outfit: Outfit }) {
  const available = outfit.available

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:shadow-lift">
      <div className="relative aspect-[3/4] overflow-hidden bg-taupe/40">
        <ImageWithFallback
          src={outfit.imageUrl}
          alt={outfit.name}
          label={outfit.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            available ? 'bg-emerald-100 text-emerald-800' : 'bg-ivory/95 text-burgundy'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-burgundy'}`}
            aria-hidden="true"
          />
          {available ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="label-caps text-gold-dark">{CATEGORY_LABELS[outfit.category]}</p>
          <h3 className="mt-1 font-display text-lg leading-snug text-ink">{outfit.name}</h3>
        </div>

        <dl className="space-y-1 text-sm text-ink/70">
          <div className="flex justify-between gap-2">
            <dt>Rental price</dt>
            <dd className="font-semibold text-ink">{formatRWF(outfit.rentalPrice)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Rental period</dt>
            <dd className="text-ink/80">{formatRentalPeriod(outfit.rentalPeriodDays)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Refundable deposit</dt>
            <dd className="text-ink/80">{formatRWF(outfit.depositAmount)}</dd>
          </div>
        </dl>

        <p className="text-xs text-ink/50">{outfit.availabilityNote}</p>

        <Link
          to={`/outfits/${outfit.id}`}
          className="mt-auto block rounded-md border border-ink/25 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:border-ink hover:bg-ink hover:text-ivory focus-visible:ring-2 focus-visible:ring-gold"
        >
          View details
        </Link>
      </div>
    </article>
  )
}
