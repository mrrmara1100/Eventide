// Section 2.1 / 2.2 — event detail with the ticket selection panel and the
// booking submit. Unauthenticated users get bounced to login and land back here.

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingsApi, eventsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Alert, Field, Spinner, inputClass } from '../components/ui'
import { formatDateTime, formatPrice, isPast } from '../utils/format'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isOrganizer } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')

    eventsApi
      .get(id)
      .then(({ data }) => {
        if (cancelled) return
        setEvent(data)
        // Preselect the first tier that can actually be bought.
        const firstAvailable = data.ticket_types.find((tt) => tt.remaining > 0)
        setSelectedId(firstAvailable?.id ?? data.ticket_types[0]?.id ?? null)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message ?? 'Could not load this event.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <Spinner label="Loading event…" />

  if (loadError || !event)
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Event not found</h1>
        <p className="mt-2 text-slate-600">
          {loadError || 'That event may have been removed.'}
        </p>
        <Link
          to="/events"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Back to all events
        </Link>
      </div>
    )

  const selected = event.ticket_types.find((tt) => tt.id === selectedId)
  const past = isPast(event.date_time)
  const canBook =
    selected && selected.remaining > 0 && !past && event.status === 'published'
  const maxQuantity = Math.min(selected?.remaining ?? 1, 10)

  const handleBook = async (e) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})

    if (!isAuthenticated) {
      // Send them to login, remembering where they were going (section 2.3).
      navigate('/login', {
        state: { from: { pathname: `/events/${event.id}` } },
        replace: false,
      })
      return
    }

    setSubmitting(true)
    try {
      const { data } = await bookingsApi.create({
        ticket_type_id: selected.id,
        quantity: Number(quantity),
      })
      navigate(`/bookings/${data.id}`, { state: { justBooked: true } })
    } catch (err) {
      setFormError(err.message ?? 'Booking failed.')
      setFieldErrors(err.errors ?? {})
      // Availability may have moved underneath us — refetch so the panel is honest.
      eventsApi
        .get(id)
        .then(({ data }) => setEvent(data))
        .catch(() => {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        to="/events"
        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← All events
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            {event.category}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {event.title}
          </h1>

          <dl className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                When
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {formatDateTime(event.date_time)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Where
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {event.venue}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Organiser
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {event.organizer?.name ?? 'Unknown'}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">
              About this event
            </h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">
              {event.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleBook}
          className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:sticky lg:top-24"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Choose your tickets
          </h2>

          {past && (
            <div className="mt-4">
              <Alert tone="info">This event has already taken place.</Alert>
            </div>
          )}

          {event.is_sold_out && !past && (
            <div className="mt-4">
              <Alert tone="info">
                Every ticket for this event has been sold.
              </Alert>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {event.ticket_types.length === 0 && (
              <p className="text-sm text-slate-500">
                The organiser has not published any ticket types yet.
              </p>
            )}

            {event.ticket_types.map((tt) => {
              const soldOut = tt.remaining === 0
              const active = tt.id === selectedId
              return (
                <label
                  key={tt.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition ${
                    active
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${soldOut ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="ticket_type"
                    value={tt.id}
                    checked={active}
                    disabled={soldOut}
                    onChange={() => {
                      setSelectedId(tt.id)
                      setQuantity(1)
                      setFieldErrors({})
                      setFormError('')
                    }}
                    className="size-4 accent-brand-600"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-900">
                      {tt.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {soldOut ? 'Sold out' : `${tt.remaining} remaining`}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(tt.price)}
                  </span>
                </label>
              )
            })}
          </div>

          {canBook && (
            <div className="mt-4">
              <Field
                label="Quantity"
                htmlFor="quantity"
                error={fieldErrors.quantity}
                hint={`Up to ${maxQuantity} per booking`}
              >
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className={inputClass}
                >
                  {Array.from({ length: maxQuantity }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ),
                  )}
                </select>
              </Field>
            </div>
          )}

          {selected && canBook && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-600">Total</span>
              <span className="text-xl font-bold text-slate-900">
                {formatPrice(selected.price * quantity)}
              </span>
            </div>
          )}

          {formError && !fieldErrors.quantity && (
            <div className="mt-4">
              <Alert>{formError}</Alert>
            </div>
          )}

          {isOrganizer ? (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
              You are signed in as an organiser. Switch to an attendee account to
              book.
            </p>
          ) : (
            <button
              type="submit"
              disabled={!canBook || submitting}
              className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting
                ? 'Confirming…'
                : !isAuthenticated
                  ? 'Log in to book'
                  : past
                    ? 'Event has passed'
                    : canBook
                      ? 'Confirm booking'
                      : 'Unavailable'}
            </button>
          )}

          {!isAuthenticated && !past && (
            <p className="mt-2 text-center text-xs text-slate-500">
              We will bring you straight back here afterwards.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
