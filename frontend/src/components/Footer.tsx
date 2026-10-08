import { Link } from 'react-router-dom'
import { CATEGORY_LABELS } from '../utils/format'
import type { OutfitCategory } from '../types'

export function Footer() {
  const categories = Object.keys(CATEGORY_LABELS) as OutfitCategory[]

  return (
    <footer className="mt-auto border-t border-gold/20 bg-ink text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl">
            Occasion<span className="text-gold">Wear</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory/60">
            Elegant occasion wear, available when your moment arrives. Rent the look, own the
            moment — Kigali, Rwanda.
          </p>
        </div>

        <nav aria-label="Footer categories">
          <p className="label-caps text-gold">Browse by occasion</p>
          <ul className="mt-4 space-y-2 text-sm text-ivory/70">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  className="transition hover:text-gold"
                  to={`/outfits?category=${category}`}
                >
                  {CATEGORY_LABELS[category]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="label-caps text-gold">Visit us</p>
          <address className="mt-4 space-y-2 text-sm not-italic text-ivory/70">
            <p>KN 4 Avenue, Kigali, Rwanda</p>
            <p>+250 788 123 456</p>
            <p>hello@occasionwear.rw</p>
            <p>Mon–Sat · 9:00–19:00</p>
          </address>
        </div>
      </div>

      <div className="border-t border-ivory/10 py-4 text-center text-xs text-ivory/40">
        © {new Date().getFullYear()} OccasionWear · Outfit booking &amp; rental · Kigali, Rwanda
      </div>
    </footer>
  )
}
