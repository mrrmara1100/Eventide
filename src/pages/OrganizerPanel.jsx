// Section 2.4 — organiser landing: every event they own, capacity at a glance,
// and the way in to editing, tiers, and registrants.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { eventsApi } from '../services/api'
import { Alert, Badge, EmptyState, Spinner } from '../components/ui'
import { formatDateTime, formatMoney } from '../utils/format'

export default function OrganizerPanel() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    eventsApi
      .mine()
      .then(({ data }) => {
        if (!cancelled) setEvents(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Could not load your events.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = async (event) => {
    if (
      !window.confirm(
        `Delete "${event.title}"? Its ticket types and every booking against them go too. This cannot be undone.`,
      )
    )
      return

    setError('')
    try {
      await eventsApi.remove(event.id)
      setEvents((prev) => prev.filter((e) => e.id !== event.id))
    } catch (err) {
      setError(err.message ?? 'Could not delete that event.')
    }
  }

  if (loading) return <Spinner label="Loading your events…" />

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Manage events
          </h1>
          <p className="mt-2 text-slate-600">
            Create events, set your ticket tiers, and watch capacity.
          </p>
        </div>
        <Link
          to="/organizer/events/new"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          New event
        </Link>
      </div>

      {error && (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {events.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No events yet">
            Create your first event to start selling tickets.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {events.map((event) => {
            const sold = event.ticket_types.reduce((sum, tt) => sum + tt.sold, 0)
            const total = event.ticket_types.reduce(
              (sum, tt) => sum + tt.quantity_available,
              0,
            )
            const revenue = event.ticket_types.reduce(
              (sum, tt) => sum + tt.sold * tt.price,
              0,
            )
            const pct = total ? Math.round((sold / total) * 100) : 0

            return (
              <div
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-900">
                        {event.title}
                      </h2>
                      <Badge status={event.status} />
                      {event.is_sold_out && (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Sold out
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(event.date_time)} · {event.venue} ·{' '}
                      {event.category}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      to={`/organizer/events/${event.id}/registrants`}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Registrants
                    </Link>
                    <Link
                      to={`/organizer/events/${event.id}/edit`}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(event)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  <Stat label="Tickets sold" value={`${sold} / ${total}`} />
                  <Stat label="Revenue" value={formatMoney(revenue)} />
                  <Stat label="Venue capacity" value={event.capacity} />
                </div>

                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 100
                          ? 'bg-slate-400'
                          : pct >= 80
                            ? 'bg-amber-500'
                            : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {pct}% of allocated tickets sold
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}
