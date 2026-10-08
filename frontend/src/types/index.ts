/** Shared types mirroring the Spring Boot REST API DTOs. */

export type Role = 'CUSTOMER' | 'ADMIN'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type OutfitStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'RENTED_OUT'
  | 'RETURNED'
  | 'DAMAGED'
  | 'RETIRED'

export type OutfitCategory =
  | 'WEDDING_GUEST'
  | 'TRADITIONAL_CEREMONY'
  | 'GRADUATION'
  | 'PHOTOSHOOT'
  | 'ACCESSORY'
  | 'BRIDAL_WEDDING_GOWNS'
  | 'CIVIL_WEDDING_ATTIRE'
  | 'BRIDAL_SHOWER'

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'

export type PaymentMethod = 'MOBILE_MONEY' | 'CARD' | 'CASH'

export type ReturnCondition = 'GOOD_ON_TIME' | 'LATE' | 'DAMAGED'

export interface AuthResponse {
  token: string
  id: number
  name: string
  email: string
  phone: string
  role: Role
  address: string | null
  staffRole: string | null
}

export interface PersonResponse {
  id: number
  name: string
  email: string
  phone: string
  role: Role
  address: string | null
  staffRole: string | null
}

export interface Outfit {
  id: number
  name: string
  category: OutfitCategory
  size: string
  color: string
  /** Fixed total price for the whole rental period — never a daily rate. */
  rentalPrice: number
  /** Rental period in days: wedding wear → 5, all other outfits → 3. */
  rentalPeriodDays: number
  depositAmount: number
  /** Late fee for each day beyond the expected return date (standard 2,000 RWF). */
  lateFeePerDay: number
  status: OutfitStatus
  imageUrl: string
  description: string | null
  available: boolean
  availabilityNote: string
}

export interface OutfitFilters {
  category?: OutfitCategory
  size?: string
  minPrice?: number
  maxPrice?: number
  startDate?: string
  endDate?: string
}

export interface OutfitPayload {
  name: string
  category: OutfitCategory
  size: string
  color: string
  /** Fixed total price for the rental period — never a daily rate. */
  rentalPrice: number
  /** Defaults by category when omitted: wedding → 5 days, other → 3 days. */
  rentalPeriodDays: number
  depositAmount: number
  lateFeePerDay?: number
  imageUrl: string
  description?: string
  status?: OutfitStatus
}

export interface CustomerSummary {
  id: number
  name: string
  email: string
  phone: string
  address: string | null
}

export interface OutfitSummary {
  id: number
  name: string
  category: OutfitCategory
  imageUrl: string
  /** Fixed total price for the rental period — never a daily rate. */
  rentalPrice: number
  rentalPeriodDays: number
  depositAmount: number
  lateFeePerDay: number
  size: string
  color: string
}

export interface PaymentSummary {
  id: number
  amount: number
  deposit: number
  method: PaymentMethod | null
  status: PaymentStatus
  paymentDate: string | null
  lateFee: number
  damageFee: number
  amountDue: number
}

export interface DeliverySummary {
  address: string
  deliveryDate: string | null
  status: string
}

export interface Booking {
  id: number
  reference: string
  startDate: string
  endDate: string
  returnDate: string | null
  status: BookingStatus
  totalAmount: number
  createdAt: string
  customer: CustomerSummary
  outfit: OutfitSummary
  payment: PaymentSummary | null
  delivery: DeliverySummary | null
}

/** Active rental awaiting return, with the server-calculated late-fee preview. */
export interface ReturnItem {
  booking: Booking
  expectedReturn: string
  /** The outfit's fixed rental period in days (wedding → 5, other → 3). */
  rentalPeriodDays: number
  /** Days overdue since the expected return date (0 when returned on/before it). */
  overdueDays: number
  /** Days that actually incur a fee: max(0, overdueDays) — no grace allowance. */
  chargeableLateDays: number
  lateFeePerDay: number
  lateFeePreview: number
}

export interface DailyRevenue {
  date: string
  revenue: number
}

export interface ReportSummary {
  totalBookings: number
  bookingsByStatus: Record<string, number>
  outfitsByStatus: Record<string, number>
  totalRevenue: number
  activeRentals: number
  damagedOutfits: number
  availableOutfits: number
  rentedOutfits: number
  pendingApprovals: number
  revenueOverTime: DailyRevenue[]
}
