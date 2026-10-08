import { apiRequest, buildQuery } from './api'
import type { Outfit, OutfitFilters } from '../types'

export const outfitService = {
  list: (filters: OutfitFilters = {}) =>
    apiRequest<Outfit[]>(`/outfits${buildQuery({ ...filters })}`),

  get: (id: number) => apiRequest<Outfit>(`/outfits/${id}`),
}
