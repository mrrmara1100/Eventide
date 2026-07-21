// Section 2.5 — the ticket itself. The QR encodes the server-minted UUID; the
// door endpoint (/organizer/check-in) is what validates it.

import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { bookingsApi } from '../services/api'
import { Alert, Badge, Spinner } from '../components/ui'
import { formatDateTime, formatPrice } from '../utils/format'

export default function BookingConfirmationPage() {
  const { id } = useParams()
  const location = useLocation()
  const justBooked = location.state?.justBooked

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    bookingsApi
      .get(id)
      .then(({ data }) => {
        if (!cancelled) setBooking(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Could not load this ticket.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <Spinner label="Loading your ticket…" />

  if (error || !booking)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Alert>{error || 'Ticket not found.'}</Alert>
        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Back to my tickets
        </Link>
      </div>
    )

  const { event, ticket_type: ticketType } = booking
  const voided = booking.status === 'cancelled'

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {justBooked && (
        <div className="mb-6">
          <Alert tone="success">
            You are in. Show this QR code at the door — screenshots work fine.
          </Alert>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-5 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-100">
            {ticketType?.name ?? 'Ticket'}
          </p>
          <h1 className="mt-1 text-xl font-bold leading-snug">
            {event?.title ?? 'Event'}
          </h1>
          <p className="mt-1 text-sm text-brand-100">
            {event && formatDateTime(event.date_time)}
          </p>
        </div>

        <div className="flex flex-col items-center border-b border-dashed border-slate-200 px-6 py-8">
          <div
            className={`rounded-xl bg-white p-4 ring-1 ring-slate-200 ${voided ? 'opacity-30' : ''}`}
          >
            <QRCodeSVG value={booking.qr_token} size={200} level="M" />
          </div>

          {voided && (
            <p className="mt-4 text-sm font-semibold text-red-600">
              This booking was cancelled — the code will not scan.
            </p>
          )}
          {booking.status === 'checked_in' && (
            <p className="mt-4 text-sm font-semibold text-blue-700">
              Already checked in — this code has been used.
            </p>
          )}

          <p className="mt-4 font-mono text-[11px] tracking-tight text-slate-400">
            {booking.qr_token}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 px-6 py-5 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Venue
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {event?.venue}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Booking ref
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              #{String(booking.id).padStart(5, '0')}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Quantity
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {booking.quantity} ticket{booking.quantity === 1 ? '' : 's'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Total paid
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {formatPrice(booking.total_price)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Status
            </dt>
            <dd className="mt-0.5">
              <Badge status={booking.status} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          to="/dashboard"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          My tickets
        </Link>
        <button
          onClick={() => window.print()}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          Print ticket
        </button>
      </div>
    </div>
  )
}
