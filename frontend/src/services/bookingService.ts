import { apiRequest } from './api'
import type { Booking, PaymentMethod } from '../types'

export interface CreateBookingPayload {
  outfitId: number
  /** The customer picks the start date only. */
  startDate: string
  /**
   * Optional. When present it must equal startDate + the outfit's fixed rental
   * period (wedding wear → 5 days, everything else → 3 days) — the server
   * derives and validates the expected return date itself.
   */
  endDate?: string
  deliveryAddress?: string
}

export const bookingService = {
  create: (payload: CreateBookingPayload) =>
    apiRequest<Booking>('/bookings', { method: 'POST', body: payload }),

  myBookings: () => apiRequest<Booking[]>('/bookings/my'),

  cancel: (id: number) => apiRequest<Booking>(`/bookings/${id}/cancel`, { method: 'POST' }),

  pay: (id: number, method: PaymentMethod, simulateFailure = false) =>
    apiRequest<Booking>(`/bookings/${id}/pay`, {
      method: 'POST',
      body: { method, simulateFailure },
    }),

  requestReturn: (id: number) => apiRequest<Booking>(`/bookings/${id}/return`, { method: 'POST' }),
}
