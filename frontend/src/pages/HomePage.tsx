import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HERO_IMAGE } from '../assets/images'
import { CategoryCard } from '../components/CategoryCard'
import { OutfitCard } from '../components/OutfitCard'
import { CardSkeleton, EmptyState, ErrorState } from '../components/States'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { outfitService } from '../services/outfitService'
import type { Outfit, OutfitCategory } from '../types'
import { errorMessage } from '../utils/format'

const CATEGORIES: OutfitCategory[] = [
  'BRIDAL_WEDDING_GOWNS',
  'CIVIL_WEDDING_ATTIRE',
  'BRIDAL_SHOWER',
  'WEDDING_GUEST',
  'TRADITIONAL_CEREMONY',
  'GRADUATION',
  'PHOTOSHOOT',
  'ACCESSORY',
]

const STEPS = [
  { title: 'Browse', text: 'Explore curated looks for your occasion' },
  { title: 'Reserve', text: 'Pick your dates and pay a deposit' },
  { title: 'Wear', text: 'Collect in Kigali or get it delivered' },
  { title: 'Return', text: 'Send it back — we handle the rest' },
]

export function HomePage() {
  useDocumentTitle('')
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    outfitService
      .list()
      .then((data) => setOutfits(data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const featured = outfits.filter((o) => o.available).slice(0, 8)

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={HERO_IMAGE}
            alt="Model wearing an elegant OccasionWear gown"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-ink/30" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
          <div className="max-w-2xl animate-fadeUp text-ivory">
            <p className="label-caps text-gold">Kigali · Occasion wear rental</p>
            <h1 className="mt-4 text-4xl font-semibold uppercase leading-[1.05] tracking-wide text-ivory sm:text-6xl">
              Dress for
              <span className="block font-normal italic text-gold">the moment</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ivory/80 sm:text-lg">
              Elegant occasion wear, available when your moment arrives. Rent the look, own the
              moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/outfits" className="btn-gold">
                Explore collection
              </Link>
              <Link
                to="/outfits"
                className="inline-flex items-center justify-center rounded-md border border-ivory/50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-ivory transition hover:border-ivory hover:bg-ivory hover:text-ink"
              >
                Book an outfit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Browse by occasion ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" aria-labelledby="occasion-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-caps text-gold-dark">Curated for you</p>
            <h2 id="occasion-heading" className="mt-2 text-3xl text-ink">
              Browse by occasion
            </h2>
          </div>
          <Link to="/outfits" className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy underline-offset-4 hover:underline">
            View all outfits →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category} category={category} />
          ))}
        </div>
      </section>

      {/* ---------------- Featured outfits ---------------- */}
      <section className="bg-white/60 py-16" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="label-caps text-gold-dark">The collection</p>
            <h2 id="featured-heading" className="mt-2 text-3xl text-ink">
              Featured outfits
            </h2>
          </div>

          <div className="mt-10">
            {loading && <CardSkeleton count={8} />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && featured.length === 0 && (
              <EmptyState
                title="No outfits available right now"
                message="The collection is being refreshed — please check back shortly."
                action={
                  <Link to="/outfits" className="btn-outline">
                    Browse the collection
                  </Link>
                }
              />
            )}
            {!loading && !error && featured.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featured.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="bg-burgundy py-16 text-ivory" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 id="how-heading" className="text-center text-3xl text-ivory">
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 font-display text-lg text-gold">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl text-ivory">{step.title}</h3>
                <p className="mt-1 text-sm text-ivory/70">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
