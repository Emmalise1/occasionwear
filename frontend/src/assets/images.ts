import type { OutfitCategory } from '../types'

/** Imagery served from `public/images` (user-supplied catalog + hero photography). */
export const HERO_IMAGE = '/images/hero.jpg'

export const LOGO_IMAGE = '/logo.svg'

/**
 * Photography used by the "Browse by occasion" cards.
 * The original five files double as the category visuals and are intentionally
 * NOT duplicated as products in the catalogue. The three wedding categories
 * reuse their own hero product photography (bridal gown / civil suit / shower
 * dress) as specified — context and group photos stay out of inventory.
 */
export const CATEGORY_IMAGES: Record<OutfitCategory, string> = {
  WEDDING_GUEST: '/images/culture-wedding-guest-group.jpg',
  TRADITIONAL_CEREMONY: '/images/editorial-traditional-portrait.jpg',
  GRADUATION: '/images/grad-black-suit-editorial.jpg',
  PHOTOSHOOT: '/images/editorial-red-feather-gown.jpg',
  ACCESSORY: '/images/editorial-jewelry-closeup.jpg',
  BRIDAL_WEDDING_GOWNS: '/images/wedding-bridal-ballgown-train.jpg',
  CIVIL_WEDDING_ATTIRE: '/images/civil-white-suit-portrait.jpg',
  BRIDAL_SHOWER: '/images/bridal-white-lace-cocktail.jpg',
}
