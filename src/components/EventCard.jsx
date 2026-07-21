import { Link } from 'react-router-dom'
import { formatDate, formatPrice, formatTime } from '../utils/format'

export default function EventCard({ event }) {
  const remaining = event.tickets_remaining
  const soldOut = event.is_sold_out
  const scarce = !soldOut && remaining > 0 && remaining <= 10

  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-coral-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-brand-50 to-slate-50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-coral-600">
            {formatDate(event.date_time)}
          </p>
          <p className="text-xs text-slate-500">{formatTime(event.date_time)}</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          {event.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
          {event.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{event.venue}</p>

        {event.description && (
          <p className="mt-3 line-clamp-2 text-sm text-slate-600">
            {event.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-sm font-semibold text-slate-900">
            {event.price_from === null
              ? 'No tickets yet'
              : event.price_from === 0
                ? 'Free'
                : `From ${formatPrice(event.price_from)}`}
          </span>

          {soldOut ? (
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Sold out
            </span>
          ) : (
            <span
              className={`text-xs font-medium ${scarce ? 'text-amber-600' : 'text-slate-500'}`}
            >
              {remaining} left
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
