import { apiRequest, buildQuery } from './api'
import type {
  Booking,
  BookingStatus,
  Outfit,
  OutfitFilters,
  OutfitPayload,
  OutfitStatus,
  ReportSummary,
  ReturnCondition,
  ReturnItem,
} from '../types'

export const adminService = {
  // ---- bookings ----
  listBookings: (status?: BookingStatus) =>
    apiRequest<Booking[]>(`/admin/bookings${buildQuery({ status })}`),

  approve: (id: number) => apiRequest<Booking>(`/admin/bookings/${id}/approve`, { method: 'PATCH' }),

  confirmPickup: (id: number) =>
    apiRequest<Booking>(`/admin/bookings/${id}/pickup`, { method: 'POST' }),

  // ---- returns ----
  returnsAwaiting: () => apiRequest<ReturnItem[]>('/admin/returns'),

  inspect: (bookingId: number, condition: ReturnCondition, damageFee?: number) =>
    apiRequest<Booking>(`/admin/returns/${bookingId}/inspect`, {
      method: 'POST',
      body: { condition, damageFee },
    }),

  // ---- inventory ----
  listOutfits: (filters: Omit<OutfitFilters, 'startDate' | 'endDate'> & { search?: string; status?: OutfitStatus } = {}) =>
    apiRequest<Outfit[]>(`/admin/outfits${buildQuery({ ...filters })}`),

  createOutfit: (payload: OutfitPayload) =>
    apiRequest<Outfit>('/admin/outfits', { method: 'POST', body: payload }),

  updateOutfit: (id: number, payload: OutfitPayload) =>
    apiRequest<Outfit>(`/admin/outfits/${id}`, { method: 'PUT', body: payload }),

  retireOutfit: (id: number) => apiRequest<Outfit>(`/admin/outfits/${id}`, { method: 'DELETE' }),

  // ---- reports ----
  reportSummary: () => apiRequest<ReportSummary>('/admin/reports/summary'),
}
