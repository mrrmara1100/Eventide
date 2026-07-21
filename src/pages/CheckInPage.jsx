// Section 2.5 — the door. Paste or scan a token, the API validates it and burns
// it. A hardware barcode scanner acts as a keyboard, so the plain text input
// works with one out of the box; a camera-based scanner can be added later.

import { useEffect, useRef, useState } from 'react'
import { bookingsApi } from '../services/api'
import { Alert, inputClass } from '../components/ui'
import { formatDateTime } from '../utils/format'

export default function CheckInPage() {
  const [token, setToken] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const inputRef = useRef(null)

  // Keep focus in the box so a scanner can fire straight into it.
  useEffect(() => {
    inputRef.current?.focus()
  }, [result, error])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token.trim()) return

    setChecking(true)
    setError('')
    setResult(null)

    try {
      const { data } = await bookingsApi.checkIn({ qr_token: token })
      setResult(data)
      setHistory((prev) => [
        { id: data.id, name: data.user?.name, at: new Date(), ok: true },
        ...prev.slice(0, 9),
      ])
      setToken('')
    } catch (err) {
      setError(err.message ?? 'Check-in failed.')
      setHistory((prev) => [
        { id: null, name: err.message, at: new Date(), ok: false },
        ...prev.slice(0, 9),
      ])
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Door check-in
      </h1>
      <p className="mt-2 text-slate-600">
        Scan or paste a ticket code. Each code works exactly once.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <label
          htmlFor="qr_token"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Ticket code
        </label>
        <div className="flex gap-2">
          <input
            id="qr_token"
            ref={inputRef}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="8f14e45f-ceea-467a-9a1b-2d3c4e5f6a7b"
            autoComplete="off"
            className={`${inputClass} font-mono`}
          />
          <button
            type="submit"
            disabled={checking || !token.trim()}
            className="shrink-0 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:bg-slate-300"
          >
            {checking ? 'Checking…' : 'Check in'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Tip: the seeded attendee has a valid code on their dashboard.
        </p>
      </form>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Admitted
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {result.user?.name}
          </p>
          <p className="text-sm text-slate-600">{result.user?.email}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-emerald-200 pt-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-700">
                Event
              </dt>
              <dd className="font-medium text-slate-900">
                {result.event?.title}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-700">
                Starts
              </dt>
              <dd className="font-medium text-slate-900">
                {result.event && formatDateTime(result.event.date_time)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-700">
                Ticket
              </dt>
              <dd className="font-medium text-slate-900">
                {result.quantity} × {result.ticket_type?.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-700">
                Booking
              </dt>
              <dd className="font-medium text-slate-900">
                #{String(result.id).padStart(5, '0')}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent scans
          </h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {history.map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${entry.ok ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                  <span
                    className={entry.ok ? 'text-slate-900' : 'text-slate-500'}
                  >
                    {entry.name}
                  </span>
                </span>
                <span className="text-xs text-slate-400">
                  {entry.at.toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
