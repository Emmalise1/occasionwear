import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { OutfitCard } from '../components/OutfitCard'
import { CardSkeleton, EmptyState, ErrorState } from '../components/States'
import { outfitService } from '../services/outfitService'
import type { Outfit, OutfitCategory } from '../types'
import { CATEGORY_LABELS, errorMessage, todayISO } from '../utils/format'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as OutfitCategory[]
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'ONE SIZE', 'EU 38']

export function OutfitsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appliedCount, setAppliedCount] = useState(0)

  const initialCategory = (searchParams.get('category') as OutfitCategory | null) ?? ''

  const [category, setCategory] = useState<string>(initialCategory)
  const [size, setSize] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [dateError, setDateError] = useState<string | null>(null)

  const load = (overrides: Partial<Record<string, string>> = {}) => {
    const effective = {
      category: overrides.category ?? category,
      size: overrides.size ?? size,
      minPrice: overrides.minPrice ?? minPrice,
      maxPrice: overrides.maxPrice ?? maxPrice,
      startDate: overrides.startDate ?? startDate,
      endDate: overrides.endDate ?? endDate,
    }

    if (effective.startDate && effective.endDate && effective.startDate >= effective.endDate) {
      setDateError('Start date must be before end date.')
      return
    }
    setDateError(null)

    setLoading(true)
    setError(null)
    outfitService
      .list({
        category: (effective.category || undefined) as OutfitCategory | undefined,
        size: effective.size || undefined,
        minPrice: effective.minPrice ? Number(effective.minPrice) : undefined,
        maxPrice: effective.maxPrice ? Number(effective.maxPrice) : undefined,
        startDate: effective.startDate || undefined,
        endDate: effective.endDate || undefined,
      })
      .then((data) => {
        setOutfits(data)
        setAppliedCount(
          Object.values(effective).filter((value) => value !== '').length,
        )
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }

  // Apply category from the URL (category cards link here).
  useEffect(() => {
    const urlCategory = searchParams.get('category') ?? ''
    setCategory(urlCategory)
    load({ category: urlCategory })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const clearFilters = () => {
    setCategory('')
    setSize('')
    setMinPrice('')
    setMaxPrice('')
    setStartDate('')
    setEndDate('')
    setDateError(null)
    setSearchParams({})
    load({
      category: '',
      size: '',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: '',
    })
  }

  const heading = useMemo(() => {
    if (category) return CATEGORY_LABELS[category as OutfitCategory]
    return 'The collection'
  }, [category])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <p className="label-caps text-gold-dark">Occasion wear · Rwanda</p>
        <h1 className="mt-2 text-4xl text-ink">{heading}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/60">
          Every piece is inspected before handover. Choose your dates and we guarantee the outfit
          is available for your entire rental period.
        </p>
      </header>

      {/* ---------------- Filters ---------------- */}
      <form
        className="card mt-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-7"
        onSubmit={(event) => {
          event.preventDefault()
          load()
        }}
        aria-label="Outfit filters"
      >
        <div className="lg:col-span-1">
          <label htmlFor="filter-category" className="label-caps">
            Category
          </label>
          <select
            id="filter-category"
            className="input-field mt-1.5"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All occasions</option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-size" className="label-caps">
            Size
          </label>
          <select
            id="filter-size"
            className="input-field mt-1.5"
            value={size}
            onChange={(event) => setSize(event.target.value)}
          >
            <option value="">Any size</option>
            {SIZES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-min" className="label-caps">
            Min price
          </label>
          <input
            id="filter-min"
            type="number"
            min="0"
            placeholder="0"
            className="input-field mt-1.5"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-max" className="label-caps">
            Max price
          </label>
          <input
            id="filter-max"
            type="number"
            min="0"
            placeholder="Any"
            className="input-field mt-1.5"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-start" className="label-caps">
            From
          </label>
          <input
            id="filter-start"
            type="date"
            min={todayISO()}
            className="input-field mt-1.5"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-end" className="label-caps">
            To
          </label>
          <input
            id="filter-end"
            type="date"
            min={startDate || todayISO()}
            className="input-field mt-1.5"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary w-full px-4 py-2.5">
            Apply
          </button>
        </div>

        {dateError && (
          <p role="alert" className="text-sm text-burgundy sm:col-span-2 lg:col-span-7">
            {dateError}
          </p>
        )}

        <div className="sm:col-span-2 lg:col-span-7 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink/50">
            {appliedCount > 0
              ? `${appliedCount} filter${appliedCount > 1 ? 's' : ''} applied`
              : 'Tip: pick dates to see only outfits free for the whole period.'}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        </div>
      </form>

      {/* ---------------- Grid ---------------- */}
      <div className="mt-10" aria-live="polite">
        {loading && <CardSkeleton count={9} />}

        {!loading && error && <ErrorState message={error} onRetry={() => load()} />}

        {!loading && !error && outfits.length === 0 && (
          <EmptyState
            title="No outfits match your selected dates."
            message="Try another date range or explore another collection."
            action={
              <button type="button" onClick={clearFilters} className="btn-outline">
                Clear filters
              </button>
            }
          />
        )}

        {!loading && !error && outfits.length > 0 && (
          <>
            <p className="mb-4 text-sm text-ink/60" role="status">
              {outfits.length} outfit{outfits.length > 1 ? 's' : ''}
              {startDate && endDate ? ` available ${startDate} → ${endDate}` : ''}
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {outfits.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
