import { Link } from 'react-router-dom'
import { CATEGORY_IMAGES } from '../assets/images'
import type { OutfitCategory } from '../types'
import { CATEGORY_BLURBS, CATEGORY_LABELS } from '../utils/format'
import { ImageWithFallback } from './ImageWithFallback'

export function CategoryCard({ category }: { category: OutfitCategory }) {
  return (
    <Link
      to={`/outfits?category=${category}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-lg border border-taupe shadow-card transition hover:shadow-lift"
    >
      <ImageWithFallback
        src={CATEGORY_IMAGES[category]}
        alt={CATEGORY_LABELS[category]}
        label={CATEGORY_LABELS[category]}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-4 text-center">
        <h3 className="font-display text-lg text-ivory">{CATEGORY_LABELS[category]}</h3>
        <p className="mt-0.5 text-xs text-gold/90">{CATEGORY_BLURBS[category]}</p>
      </div>
    </Link>
  )
}
