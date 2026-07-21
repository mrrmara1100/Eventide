// Section 2.1 — public event browsing. Filters live in the URL so a filtered
// listing can be linked, bookmarked, and survives the back button.

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventsApi } from '../services/api'
import { CATEGORIES } from '../services/mockData'
import EventCard from '../components/EventCard'
import Pagination from '../components/Pagination'
import { Alert, EmptyState, Spinner, inputClass } from '../components/ui'

const PER_PAGE = 6

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const page = Number(searchParams.get('page') ?? 1)

  // Local mirror of the search box so typing stays responsive; the URL only
  // catches up after the debounce below.
  const [searchInput, setSearchInput] = useState(search)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Keep the box in sync when the URL changes from elsewhere (back button,
  // "clear filters").
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, String(value))
      else next.delete(key)
    }
    // Any filter change invalidates the current page number.
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== search) updateParams({ search: searchInput })
    }, 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    eventsApi
      .list({ search, category, from, to, page, perPage: PER_PAGE })
      .then((res) => {
        if (!cancelled) setResult(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Could not load events.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, category, from, to, page])

  const hasFilters = Boolean(search || category || from || to)

  const goToPage = (next) => {
    updateParams({ page: next === 1 ? '' : next })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-coral-600">
          Browse events
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Find your next <span className="italic text-brand-600">favorite</span> night
          out.
        </h1>
        <p className="mt-3 max-w-xl text-slate-600">
          Browse everything on sale — no account needed until you book.
        </p>
      </div>

      <div className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <label htmlFor="search" className="sr-only">
              Search events
            </label>
            <input
              id="search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, venue, or description…"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="from" className="sr-only">
              From date
            </label>
            <input
              id="from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => updateParams({ from: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="to" className="sr-only">
              To date
            </label>
            <input
              id="to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => updateParams({ to: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => updateParams({ category: '' })}
            className={chipClass(category === '')}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => updateParams({ category: c })}
              className={chipClass(category === c)}
            >
              {c}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="ml-auto text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Spinner label="Loading events…" />
      ) : result?.data.length ? (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {result.meta.total} event{result.meta.total === 1 ? '' : 's'} found
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Pagination meta={result.meta} onChange={goToPage} />
        </>
      ) : (
        !error && (
          <EmptyState title="No events match those filters">
            Try a different keyword, or clear the filters to see everything.
          </EmptyState>
        )
      )}
    </div>
  )
}

const chipClass = (active) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-brand-600 bg-brand-600 text-white'
      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
  }`
