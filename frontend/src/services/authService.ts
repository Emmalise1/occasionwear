import { apiRequest } from './api'
import type { AuthResponse, PersonResponse } from '../types'

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  address: string
  password: string
  confirmPassword: string
}

export const authService = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      token: null,
    }),

  register: (payload: RegisterPayload) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
      token: null,
    }),

  me: () => apiRequest<PersonResponse>('/auth/me'),
}
