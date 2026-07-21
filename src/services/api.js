// The single seam between the React app and its data source.
//
// Today every call lands on the in-browser mock backend. In week 10-11, when
// the Laravel API is up, flip USE_MOCK to false (or set VITE_API_URL in .env)
// and the axios branch takes over — the exported functions keep their
// signatures and return shapes, so no component has to change.

import axios from 'axios'
import { backend, ApiError } from './mockBackend'

const API_URL = import.meta.env.VITE_API_URL ?? ''
const USE_MOCK = !API_URL

export const TOKEN_KEY = 'eventide.token'

const getToken = () => localStorage.getItem(TOKEN_KEY)

// --- real client (dormant until the Laravel API exists) ---------------------

const http = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalise axios failures into the same ApiError the mock throws, so the UI
// only ever has one error shape to handle.
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { status, data } = error.response ?? {}
    throw new ApiError(
      status ?? 0,
      data?.message ?? error.message ?? 'Something went wrong.',
      data?.errors ?? null,
    )
  },
)

// Picks the mock handler or the HTTP call depending on the mode above.
const route = (mockFn, httpFn) => (...args) =>
  USE_MOCK ? mockFn(...args) : httpFn(...args)

// --- auth -------------------------------------------------------------------

export const authApi = {
  register: route(
    (payload) => backend.register(payload),
    (payload) => http.post('/register', payload),
  ),
  login: route(
    (payload) => backend.login(payload),
    (payload) => http.post('/login', payload),
  ),
  me: route(
    () => backend.me(getToken()),
    () => http.get('/user'),
  ),
}

// --- events -----------------------------------------------------------------

export const eventsApi = {
  list: route(
    (params) => backend.listEvents(params),
    (params) => http.get('/events', { params }),
  ),
  get: route(
    (id) => backend.getEvent(id),
    (id) => http.get(`/events/${id}`),
  ),
  mine: route(
    () => backend.listOrganizerEvents(getToken()),
    () => http.get('/organizer/events'),
  ),
  create: route(
    (payload) => backend.createEvent(getToken(), payload),
    (payload) => http.post('/events', payload),
  ),
  update: route(
    (id, payload) => backend.updateEvent(getToken(), id, payload),
    (id, payload) => http.put(`/events/${id}`, payload),
  ),
  remove: route(
    (id) => backend.deleteEvent(getToken(), id),
    (id) => http.delete(`/events/${id}`),
  ),
  registrants: route(
    (id) => backend.listRegistrants(getToken(), id),
    (id) => http.get(`/events/${id}/registrants`),
  ),
}

// --- ticket types -----------------------------------------------------------

export const ticketTypesApi = {
  create: route(
    (payload) => backend.createTicketType(getToken(), payload),
    (payload) => http.post('/ticket-types', payload),
  ),
  update: route(
    (id, payload) => backend.updateTicketType(getToken(), id, payload),
    (id, payload) => http.put(`/ticket-types/${id}`, payload),
  ),
  remove: route(
    (id) => backend.deleteTicketType(getToken(), id),
    (id) => http.delete(`/ticket-types/${id}`),
  ),
}

// --- bookings ---------------------------------------------------------------

export const bookingsApi = {
  list: route(
    () => backend.listBookings(getToken()),
    () => http.get('/bookings'),
  ),
  get: route(
    (id) => backend.getBooking(getToken(), id),
    (id) => http.get(`/bookings/${id}`),
  ),
  create: route(
    (payload) => backend.createBooking(getToken(), payload),
    (payload) => http.post('/bookings', payload),
  ),
  cancel: route(
    (id) => backend.cancelBooking(getToken(), id),
    (id) => http.delete(`/bookings/${id}`),
  ),
  checkIn: route(
    (payload) => backend.checkIn(getToken(), payload),
    (payload) => http.post('/check-in', payload),
  ),
}

export { ApiError }
export { resetDatabase } from './mockBackend'
