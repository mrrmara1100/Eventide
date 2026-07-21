// The mock backend — stands in for Laravel until week 8-10 of the build.
//
// Everything here is deliberately shaped like the real thing: the store holds
// the four tables from the proposal's schema, handlers apply the same rules the
// Laravel controllers will (server-side UUIDs, capacity checks, single-use QR
// tokens, role gates), and every handler is async with a little latency so the
// UI has to deal with real loading states.
//
// State persists in localStorage so a refresh does not wipe your bookings.

import {
  seedUsers,
  seedEvents,
  seedTicketTypes,
  seedBookings,
} from './mockData'

const STORAGE_KEY = 'eventide.db.v1'
const LATENCY_MS = 220

// --- store ------------------------------------------------------------------

const freshDb = () => ({
  users: structuredClone(seedUsers),
  events: structuredClone(seedEvents),
  ticket_types: structuredClone(seedTicketTypes),
  bookings: structuredClone(seedBookings),
})

let db = null

const load = () => {
  if (db) return db
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    db = raw ? JSON.parse(raw) : freshDb()
  } catch {
    db = freshDb()
  }
  return db
}

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage full or blocked — the in-memory copy still works for this session.
  }
}

export const resetDatabase = () => {
  db = freshDb()
  persist()
}

const nextId = (table) =>
  table.reduce((max, row) => Math.max(max, row.id), 0) + 1

const uuid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })

const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS))

// Mirrors a Laravel JSON error response closely enough that the swap to the
// real API will not change how components handle failures.
class ApiError extends Error {
  constructor(status, message, errors = null) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

const fail = (status, message, errors) => {
  throw new ApiError(status, message, errors)
}

// --- token / session --------------------------------------------------------

// Sanctum issues an opaque token; we fake one that maps back to a user id.
const issueToken = (userId) => `mock-${userId}-${uuid()}`
const userIdFromToken = (token) => {
  const match = /^mock-(\d+)-/.exec(token ?? '')
  return match ? Number(match[1]) : null
}

const authenticate = (token) => {
  const id = userIdFromToken(token)
  const user = id && load().users.find((u) => u.id === id)
  if (!user) fail(401, 'Unauthenticated.')
  return user
}

const requireOrganizer = (token) => {
  const user = authenticate(token)
  if (user.role !== 'organizer') fail(403, 'This action is unauthorized.')
  return user
}

// --- serialisers ------------------------------------------------------------

// Strips the password the way a Laravel API Resource would.
const publicUser = (user) => {
  const { password: _password, ...rest } = user
  return rest
}

// Tickets sold counts anything not cancelled — a checked-in seat is still taken.
const soldForTicketType = (ticketTypeId) =>
  load()
    .bookings.filter(
      (b) => b.ticket_type_id === ticketTypeId && b.status !== 'cancelled',
    )
    .reduce((sum, b) => sum + b.quantity, 0)

const ticketTypeResource = (tt) => {
  const sold = soldForTicketType(tt.id)
  return {
    ...tt,
    price: Number(tt.price),
    sold,
    remaining: Math.max(0, tt.quantity_available - sold),
  }
}

const eventResource = (event, { withTicketTypes = true } = {}) => {
  const ticketTypes = load()
    .ticket_types.filter((tt) => tt.event_id === event.id)
    .map(ticketTypeResource)

  const remaining = ticketTypes.reduce((sum, tt) => sum + tt.remaining, 0)
  const organizer = load().users.find((u) => u.id === event.organizer_id)

  return {
    ...event,
    organizer: organizer ? publicUser(organizer) : null,
    tickets_remaining: remaining,
    is_sold_out: ticketTypes.length > 0 && remaining === 0,
    price_from: ticketTypes.length
      ? Math.min(...ticketTypes.map((tt) => tt.price))
      : null,
    ...(withTicketTypes ? { ticket_types: ticketTypes } : {}),
  }
}

// A booking is only meaningful alongside its ticket type and event, so the API
// nests them the way an Eloquent `with()` eager load would.
const bookingResource = (booking) => {
  const ticketType = load().ticket_types.find(
    (tt) => tt.id === booking.ticket_type_id,
  )
  const event =
    ticketType && load().events.find((e) => e.id === ticketType.event_id)

  return {
    ...booking,
    ticket_type: ticketType ? ticketTypeResource(ticketType) : null,
    event: event ? eventResource(event, { withTicketTypes: false }) : null,
    total_price: ticketType ? Number(ticketType.price) * booking.quantity : 0,
  }
}

// --- handlers ---------------------------------------------------------------

export const backend = {
  // POST /api/register
  async register({ name, email, password, role = 'attendee' }) {
    await delay()
    const errors = {}
    if (!name?.trim()) errors.name = ['The name field is required.']
    if (!email?.trim()) errors.email = ['The email field is required.']
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = ['The email must be a valid email address.']
    else if (load().users.some((u) => u.email === email.toLowerCase()))
      errors.email = ['The email has already been taken.']
    if (!password || password.length < 8)
      errors.password = ['The password must be at least 8 characters.']
    if (!['attendee', 'organizer'].includes(role))
      errors.role = ['The selected role is invalid.']

    if (Object.keys(errors).length)
      fail(422, 'The given data was invalid.', errors)

    const user = {
      id: nextId(load().users),
      name: name.trim(),
      email: email.toLowerCase(),
      password, // Laravel will bcrypt this; plain text is fine for a mock.
      role,
    }
    load().users.push(user)
    persist()

    return { user: publicUser(user), token: issueToken(user.id) }
  },

  // POST /api/login
  async login({ email, password }) {
    await delay()
    const user = load().users.find(
      (u) => u.email === email?.toLowerCase().trim() && u.password === password,
    )
    if (!user)
      fail(422, 'The given data was invalid.', {
        email: ['These credentials do not match our records.'],
      })

    return { user: publicUser(user), token: issueToken(user.id) }
  },

  // GET /api/user
  async me(token) {
    await delay()
    return { user: publicUser(authenticate(token)) }
  },

  // GET /api/events — public, no token required.
  async listEvents({
    search = '',
    category = '',
    from = '',
    to = '',
    page = 1,
    perPage = 6,
  } = {}) {
    await delay()

    let rows = load().events.filter((e) => e.status === 'published')

    const term = search.trim().toLowerCase()
    if (term) {
      rows = rows.filter(
        (e) =>
          e.title.toLowerCase().includes(term) ||
          e.venue.toLowerCase().includes(term) ||
          (e.description ?? '').toLowerCase().includes(term),
      )
    }
    if (category) rows = rows.filter((e) => e.category === category)
    if (from) rows = rows.filter((e) => new Date(e.date_time) >= new Date(from))
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      rows = rows.filter((e) => new Date(e.date_time) <= end)
    }

    rows.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))

    // Shaped like Laravel's paginator so the Pagination component will not
    // change when the real API lands.
    const total = rows.length
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    const current = Math.min(Math.max(1, page), lastPage)
    const start = (current - 1) * perPage

    return {
      data: rows
        .slice(start, start + perPage)
        .map((e) => eventResource(e, { withTicketTypes: false })),
      meta: {
        current_page: current,
        last_page: lastPage,
        per_page: perPage,
        total,
      },
    }
  },

  // GET /api/events/{id} — public.
  async getEvent(id) {
    await delay()
    const event = load().events.find((e) => e.id === Number(id))
    if (!event) fail(404, 'Event not found.')
    return { data: eventResource(event) }
  },

  // GET /api/organizer/events — organiser's own events, drafts included.
  async listOrganizerEvents(token) {
    await delay()
    const user = requireOrganizer(token)
    const rows = load()
      .events.filter((e) => e.organizer_id === user.id)
      .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
    return { data: rows.map((e) => eventResource(e)) }
  },

  // POST /api/events
  async createEvent(token, payload) {
    await delay()
    const user = requireOrganizer(token)
    const errors = validateEvent(payload)
    if (Object.keys(errors).length)
      fail(422, 'The given data was invalid.', errors)

    const event = {
      id: nextId(load().events),
      organizer_id: user.id,
      title: payload.title.trim(),
      description: payload.description?.trim() ?? '',
      venue: payload.venue.trim(),
      date_time: new Date(payload.date_time).toISOString(),
      category: payload.category,
      capacity: Number(payload.capacity),
      status: payload.status ?? 'draft',
    }
    load().events.push(event)
    persist()
    return { data: eventResource(event) }
  },

  // PUT /api/events/{id}
  async updateEvent(token, id, payload) {
    await delay()
    const user = requireOrganizer(token)
    const event = load().events.find((e) => e.id === Number(id))
    if (!event) fail(404, 'Event not found.')
    if (event.organizer_id !== user.id) fail(403, 'This action is unauthorized.')

    const errors = validateEvent(payload)
    if (Object.keys(errors).length)
      fail(422, 'The given data was invalid.', errors)

    Object.assign(event, {
      title: payload.title.trim(),
      description: payload.description?.trim() ?? '',
      venue: payload.venue.trim(),
      date_time: new Date(payload.date_time).toISOString(),
      category: payload.category,
      capacity: Number(payload.capacity),
      status: payload.status,
    })
    persist()
    return { data: eventResource(event) }
  },

  // DELETE /api/events/{id}
  async deleteEvent(token, id) {
    await delay()
    const user = requireOrganizer(token)
    const event = load().events.find((e) => e.id === Number(id))
    if (!event) fail(404, 'Event not found.')
    if (event.organizer_id !== user.id) fail(403, 'This action is unauthorized.')

    const ticketTypeIds = load()
      .ticket_types.filter((tt) => tt.event_id === event.id)
      .map((tt) => tt.id)

    // Cascade, the way the migration's onDelete('cascade') will.
    db.bookings = db.bookings.filter(
      (b) => !ticketTypeIds.includes(b.ticket_type_id),
    )
    db.ticket_types = db.ticket_types.filter((tt) => tt.event_id !== event.id)
    db.events = db.events.filter((e) => e.id !== event.id)
    persist()
    return { message: 'Event deleted.' }
  },

  // POST /api/ticket-types
  async createTicketType(token, payload) {
    await delay()
    const user = requireOrganizer(token)
    const event = load().events.find((e) => e.id === Number(payload.event_id))
    if (!event) fail(404, 'Event not found.')
    if (event.organizer_id !== user.id) fail(403, 'This action is unauthorized.')

    const errors = validateTicketType(payload)
    if (Object.keys(errors).length)
      fail(422, 'The given data was invalid.', errors)

    const ticketType = {
      id: nextId(load().ticket_types),
      event_id: event.id,
      name: payload.name.trim(),
      price: Number(payload.price),
      quantity_available: Number(payload.quantity_available),
    }
    load().ticket_types.push(ticketType)
    persist()
    return { data: ticketTypeResource(ticketType) }
  },

  // PUT /api/ticket-types/{id}
  async updateTicketType(token, id, payload) {
    await delay()
    const user = requireOrganizer(token)
    const ticketType = load().ticket_types.find((tt) => tt.id === Number(id))
    if (!ticketType) fail(404, 'Ticket type not found.')
    const event = load().events.find((e) => e.id === ticketType.event_id)
    if (event.organizer_id !== user.id) fail(403, 'This action is unauthorized.')

    const errors = validateTicketType(payload)
    // Cannot shrink a tier below what has already been sold.
    const sold = soldForTicketType(ticketType.id)
    if (Number(payload.quantity_available) < sold)
      errors.quantity_available = [
        `${sold} ticket${sold === 1 ? ' has' : 's have'} already been sold; quantity cannot be lower.`,
      ]
    if (Object.keys(errors).length)
      fail(422, 'The given data was invalid.', errors)

    Object.assign(ticketType, {
      name: payload.name.trim(),
      price: Number(payload.price),
      quantity_available: Number(payload.quantity_available),
    })
    persist()
    return { data: ticketTypeResource(ticketType) }
  },

  // DELETE /api/ticket-types/{id}
  async deleteTicketType(token, id) {
    await delay()
    const user = requireOrganizer(token)
    const ticketType = load().ticket_types.find((tt) => tt.id === Number(id))
    if (!ticketType) fail(404, 'Ticket type not found.')
    const event = load().events.find((e) => e.id === ticketType.event_id)
    if (event.organizer_id !== user.id) fail(403, 'This action is unauthorized.')
    if (soldForTicketType(ticketType.id) > 0)
      fail(422, 'Cannot delete a ticket type that has bookings against it.')

    db.ticket_types = db.ticket_types.filter((tt) => tt.id !== ticketType.id)
    persist()
    return { message: 'Ticket type deleted.' }
  },

  // POST /api/bookings — the QR token is minted here, server-side.
  async createBooking(token, { ticket_type_id, quantity }) {
    await delay()
    const user = authenticate(token)

    const ticketType = load().ticket_types.find(
      (tt) => tt.id === Number(ticket_type_id),
    )
    if (!ticketType) fail(404, 'Ticket type not found.')

    const event = load().events.find((e) => e.id === ticketType.event_id)
    if (!event || event.status !== 'published')
      fail(422, 'This event is not open for registration.')

    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 1)
      fail(422, 'The given data was invalid.', {
        quantity: ['You must book at least one ticket.'],
      })

    const remaining =
      ticketType.quantity_available - soldForTicketType(ticketType.id)
    if (qty > remaining)
      fail(422, 'The given data was invalid.', {
        quantity: [
          remaining === 0
            ? 'This ticket type is sold out.'
            : `Only ${remaining} ticket${remaining === 1 ? '' : 's'} left for this type.`,
        ],
      })

    const booking = {
      id: nextId(load().bookings),
      user_id: user.id,
      ticket_type_id: ticketType.id,
      quantity: qty,
      qr_token: uuid(),
      status: 'confirmed',
    }
    load().bookings.push(booking)
    persist()
    return { data: bookingResource(booking) }
  },

  // GET /api/bookings — the caller's own bookings.
  async listBookings(token) {
    await delay()
    const user = authenticate(token)
    const rows = load()
      .bookings.filter((b) => b.user_id === user.id)
      .map(bookingResource)
      .sort(
        (a, b) =>
          new Date(b.event?.date_time ?? 0) - new Date(a.event?.date_time ?? 0),
      )
    return { data: rows }
  },

  // GET /api/bookings/{id}
  async getBooking(token, id) {
    await delay()
    const user = authenticate(token)
    const booking = load().bookings.find((b) => b.id === Number(id))
    if (!booking) fail(404, 'Booking not found.')
    if (booking.user_id !== user.id) fail(403, 'This action is unauthorized.')
    return { data: bookingResource(booking) }
  },

  // DELETE /api/bookings/{id} — soft cancel; the row stays for the audit trail.
  async cancelBooking(token, id) {
    await delay()
    const user = authenticate(token)
    const booking = load().bookings.find((b) => b.id === Number(id))
    if (!booking) fail(404, 'Booking not found.')
    if (booking.user_id !== user.id) fail(403, 'This action is unauthorized.')
    if (booking.status === 'checked_in')
      fail(422, 'A ticket that has been checked in cannot be cancelled.')

    booking.status = 'cancelled'
    persist()
    return { data: bookingResource(booking) }
  },

  // GET /api/events/{id}/registrants — organiser only.
  async listRegistrants(token, eventId) {
    await delay()
    const user = requireOrganizer(token)
    const event = load().events.find((e) => e.id === Number(eventId))
    if (!event) fail(404, 'Event not found.')
    if (event.organizer_id !== user.id) fail(403, 'This action is unauthorized.')

    const ticketTypeIds = load()
      .ticket_types.filter((tt) => tt.event_id === event.id)
      .map((tt) => tt.id)

    const rows = load()
      .bookings.filter((b) => ticketTypeIds.includes(b.ticket_type_id))
      .map((b) => {
        const attendee = load().users.find((u) => u.id === b.user_id)
        return { ...bookingResource(b), user: attendee ? publicUser(attendee) : null }
      })

    return { data: rows, event: eventResource(event) }
  },

  // POST /api/check-in — the door endpoint. A token works exactly once.
  async checkIn(token, { qr_token }) {
    await delay()
    const user = requireOrganizer(token)

    const booking = load().bookings.find(
      (b) => b.qr_token === qr_token?.trim(),
    )
    if (!booking) fail(404, 'No ticket matches that code.')

    const ticketType = load().ticket_types.find(
      (tt) => tt.id === booking.ticket_type_id,
    )
    const event = load().events.find((e) => e.id === ticketType?.event_id)
    if (event?.organizer_id !== user.id)
      fail(403, 'That ticket belongs to an event you do not manage.')

    if (booking.status === 'cancelled')
      fail(422, 'This booking was cancelled and is not valid for entry.')
    if (booking.status === 'checked_in')
      fail(409, 'This ticket has already been checked in.')

    booking.status = 'checked_in'
    persist()

    const attendee = load().users.find((u) => u.id === booking.user_id)
    return {
      data: { ...bookingResource(booking), user: attendee ? publicUser(attendee) : null },
    }
  },
}

// --- validation -------------------------------------------------------------

function validateEvent(payload) {
  const errors = {}
  if (!payload.title?.trim()) errors.title = ['The title field is required.']
  if (!payload.venue?.trim()) errors.venue = ['The venue field is required.']
  if (!payload.date_time) errors.date_time = ['The date and time are required.']
  if (!payload.category) errors.category = ['Pick a category.']
  const capacity = Number(payload.capacity)
  if (!Number.isInteger(capacity) || capacity < 1)
    errors.capacity = ['Capacity must be a whole number of at least 1.']
  if (payload.status && !['draft', 'published', 'cancelled'].includes(payload.status))
    errors.status = ['The selected status is invalid.']
  return errors
}

function validateTicketType(payload) {
  const errors = {}
  if (!payload.name?.trim()) errors.name = ['The name field is required.']
  const price = Number(payload.price)
  if (!Number.isFinite(price) || price < 0)
    errors.price = ['Price must be 0.00 or more.']
  const qty = Number(payload.quantity_available)
  if (!Number.isInteger(qty) || qty < 1)
    errors.quantity_available = ['Quantity must be a whole number of at least 1.']
  return errors
}

export { ApiError }
