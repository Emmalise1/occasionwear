import type { BookingStatus, OutfitCategory, OutfitStatus, PaymentStatus } from '../types'

/** 150000 → "150,000 RWF" */
export function formatRWF(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0)
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)} RWF`
}

/**
 * Categories rented for 5 days. Everything else (Graduation, Traditional
 * Ceremony, Bridal Shower, Photoshoot, Accessories, …) is rented for 3 days.
 * Mirrors RentalPeriods on the backend — Bridal Shower is deliberately NOT
 * treated as wedding wear for this rule.
 */
const WEDDING_CATEGORIES: OutfitCategory[] = [
  'BRIDAL_WEDDING_GOWNS',
  'CIVIL_WEDDING_ATTIRE',
  'WEDDING_GUEST',
]

export const WEDDING_RENTAL_DAYS = 5
export const DEFAULT_RENTAL_DAYS = 3

/** Default rental period (days) for a category — wedding → 5, all others → 3. */
export function defaultRentalPeriod(category: OutfitCategory): number {
  return WEDDING_CATEGORIES.includes(category) ? WEDDING_RENTAL_DAYS : DEFAULT_RENTAL_DAYS
}

/** 5 → "5 days", 1 → "1 day". */
export function formatRentalPeriod(days: number | null | undefined): string {
  const value = Number(days ?? 0)
  return `${value} day${value === 1 ? '' : 's'}`
}

/** Human sentence explaining how the price is charged — used at checkout. */
export function rentalPriceNote(): string {
  return 'One fixed price for the whole rental period — never a daily rate.'
}

/** "2026-06-10" plus 5 days → "2026-06-15" (local calendar arithmetic). */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d + days)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

/** "2026-12-20" → "20 Dec 2026" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** ISO datetime → "6 Oct 2026, 10:00" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function plusDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  ACTIVE: 'Active rental',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

/** Spec: PENDING amber · CONFIRMED blue · ACTIVE green · COMPLETED green · CANCELLED red */
export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PAID: 'bg-blue-100 text-blue-800 border-blue-200',
  REFUNDED: 'bg-taupe/60 text-ink border-taupe',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
}

export const OUTFIT_STATUS_STYLES: Record<OutfitStatus, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  RESERVED: 'bg-blue-100 text-blue-800 border-blue-200',
  RENTED_OUT: 'bg-amber-100 text-amber-800 border-amber-200',
  RETURNED: 'bg-taupe/60 text-ink border-taupe',
  DAMAGED: 'bg-red-100 text-red-700 border-red-200',
  RETIRED: 'bg-ink/10 text-ink/70 border-ink/20',
}

export const OUTFIT_STATUS_LABELS: Record<OutfitStatus, string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  RENTED_OUT: 'Rented out',
  RETURNED: 'Awaiting inspection',
  DAMAGED: 'Damaged',
  RETIRED: 'Retired',
}

export const CATEGORY_LABELS: Record<OutfitCategory, string> = {
  WEDDING_GUEST: 'Wedding Guest',
  TRADITIONAL_CEREMONY: 'Traditional Ceremony',
  GRADUATION: 'Graduation',
  PHOTOSHOOT: 'Photoshoot',
  ACCESSORY: 'Accessories',
  BRIDAL_WEDDING_GOWNS: 'Bridal Wedding Gowns',
  CIVIL_WEDDING_ATTIRE: 'Civil Wedding Attire',
  BRIDAL_SHOWER: 'Bridal Shower',
}

export const CATEGORY_BLURBS: Record<OutfitCategory, string> = {
  WEDDING_GUEST: 'Turn heads at every reception',
  TRADITIONAL_CEREMONY: 'Heritage looks for honoured occasions',
  GRADUATION: 'Celebrate the milestone in style',
  PHOTOSHOOT: 'Camera-ready for the studio',
  ACCESSORY: 'The finishing touch',
  BRIDAL_WEDDING_GOWNS: 'Premium gowns for the aisle',
  CIVIL_WEDDING_ATTIRE: 'Elegant attire for civil ceremonies',
  BRIDAL_SHOWER: 'Chic looks for the bridal shower',
}

/** Reads an error into a user-friendly message. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
