// Section 2.2 — "view and manage all past and upcoming bookings from a personal
// dashboard".

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Alert, Badge, EmptyState, Spinner } from '../components/ui'
import { formatDateTime, formatPrice, isPast } from '../utils/format'

export default function DashboardPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    bookingsApi
      .list()
      .then(({ data }) => {
        if (!cancelled) setBookings(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Could not load your bookings.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCancel = async (booking) => {
    if (
      !window.confirm(
        `Cancel your ${booking.quantity} ticket(s) for ${booking.event?.title}? This frees the seats for someone else.`,
      )
    )
      return

    setCancellingId(booking.id)
    setError('')
    try {
      const { data } = await bookingsApi.cancel(booking.id)
      setBookings((prev) => prev.map((b) => (b.id === data.id ? data : b)))
    } catch (err) {
      setError(err.message ?? 'Could not cancel that booking.')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <Spinner label="Loading your tickets…" />

  const upcoming = bookings.filter(
    (b) => b.event && !isPast(b.event.date_time) && b.status !== 'cancelled',
  )
  const rest = bookings.filter((b) => !upcoming.includes(b))

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        My tickets
      </h1>
      <p className="mt-2 text-slate-600">
        Signed in as {user.name} · {bookings.length} booking
        {bookings.length === 1 ? '' : 's'} on record
      </p>

      {error && (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No bookings yet">
            <Link to="/events" className="text-brand-700 hover:underline">
              Browse events
            </Link>{' '}
            and grab your first ticket.
          </EmptyState>
        </div>
      ) : (
        <>
          <Section title="Upcoming" bookings={upcoming}>
            {(booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                cancelling={cancellingId === booking.id}
              />
            )}
          </Section>

          <Section title="Past & cancelled" bookings={rest}>
            {(booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                cancelling={cancellingId === booking.id}
              />
            )}
          </Section>
        </>
      )}
    </div>
  )
}

function Section({ title, bookings, children }) {
  if (bookings.length === 0) return null
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="space-y-3">{bookings.map(children)}</div>
    </section>
  )
}

function BookingRow({ booking, onCancel, cancelling }) {
  const { event } = booking
  const past = event ? isPast(event.date_time) : false
  const canCancel = booking.status === 'confirmed' && !past

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">
            {event?.title ?? 'Event removed'}
          </h3>
          <Badge status={booking.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {event ? `${formatDateTime(event.date_time)} · ${event.venue}` : '—'}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {booking.quantity} × {booking.ticket_type?.name} ·{' '}
          <span className="font-medium">{formatPrice(booking.total_price)}</span>
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Link
          to={`/bookings/${booking.id}`}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          View ticket
        </Link>
        {canCancel && (
          <button
            onClick={() => onCancel(booking)}
            disabled={cancelling}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  )
}
