// Section 2.4 — "view a full registrant list per event" and "export attendee
// data as needed". The export is a client-side CSV; the Laravel build can swap
// in a real download endpoint later.

import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { eventsApi } from '../services/api'
import { Alert, Badge, EmptyState, Spinner } from '../components/ui'
import { formatDateTime, formatMoney, formatPrice } from '../utils/format'

export default function RegistrantsPage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [registrants, setRegistrants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    eventsApi
      .registrants(id)
      .then((res) => {
        if (cancelled) return
        setRegistrants(res.data)
        setEvent(res.event)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Could not load registrants.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const visible = useMemo(
    () =>
      filter === 'all'
        ? registrants
        : registrants.filter((r) => r.status === filter),
    [registrants, filter],
  )

  const stats = useMemo(() => {
    const active = registrants.filter((r) => r.status !== 'cancelled')
    return {
      bookings: active.length,
      tickets: active.reduce((sum, r) => sum + r.quantity, 0),
      checkedIn: registrants.filter((r) => r.status === 'checked_in').length,
      revenue: active.reduce((sum, r) => sum + r.total_price, 0),
    }
  }, [registrants])

  const exportCsv = () => {
    const header = [
      'Booking ID',
      'Name',
      'Email',
      'Ticket type',
      'Quantity',
      'Total',
      'Status',
      'QR token',
    ]
    // Quote every field and escape inner quotes — names and tiers can contain commas.
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = visible.map((r) => [
      r.id,
      r.user?.name,
      r.user?.email,
      r.ticket_type?.name,
      r.quantity,
      r.total_price.toFixed(2),
      r.status,
      r.qr_token,
    ])

    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n')
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `registrants-event-${id}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <Spinner label="Loading registrants…" />

  if (error)
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <Alert>{error}</Alert>
      </div>
    )

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        to="/organizer"
        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        ← Manage events
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {event?.title}
          </h1>
          <p className="mt-1 text-slate-600">
            {event && formatDateTime(event.date_time)} · {event?.venue}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Bookings" value={stats.bookings} />
        <Stat label="Tickets" value={stats.tickets} />
        <Stat label="Checked in" value={stats.checkedIn} />
        <Stat label="Revenue" value={formatMoney(stats.revenue)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['all', 'confirmed', 'checked_in', 'cancelled'].map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              filter === value
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {value === 'all'
              ? 'All'
              : value === 'checked_in'
                ? 'Checked in'
                : value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nobody here yet">
            {filter === 'all'
              ? 'No one has registered for this event.'
              : 'No bookings with that status.'}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Attendee</th>
                <th className="px-5 py-3 font-medium">Ticket</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{r.user?.name}</p>
                    <p className="text-xs text-slate-500">{r.user?.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {r.ticket_type?.name}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{r.quantity}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatPrice(r.total_price)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
